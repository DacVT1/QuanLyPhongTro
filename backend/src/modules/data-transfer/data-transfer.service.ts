import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import archiver = require('archiver');
import { PassThrough } from 'stream';
import { existsSync, statSync } from 'fs';
import { join, resolve, sep } from 'path';

@Injectable()
export class DataTransferService {
  constructor(private readonly dataSource: DataSource) {}

  async exportTenant(tenantId: string): Promise<Buffer> {
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();

    try {
      // 1. Lấy thông tin tenant hiện tại
      const tenantRows = await runner.query(
        'SELECT * FROM "tenant" WHERE "id" = $1',
        [tenantId],
      );

      if (!tenantRows.length) {
        throw new NotFoundException('Không tìm thấy tenant.');
      }

      // Chỉ lấy các bảng thuộc tenant đang đăng nhập.
      // Không đưa bảng OTP hoặc dữ liệu xác thực tạm thời vào backup.
      const tables = [
        'tai_khoan',
        'nha_tro',
        'phong',
        'giuong',
        'nguoi_thue',
        'hop_dong',
        'hoa_don',
        'subscription',
      ];

      const data: Record<string, any> = {
        tenant: tenantRows[0],
      };

      for (const table of tables) {
        data[table] = await runner.query(
          `SELECT * FROM "${table}" WHERE "tenant_id" = $1`,
          [tenantId],
        );
      }

      // 2. Tìm các đường dẫn file trong dữ liệu database
      const referencedPaths = new Set<string>();

      const scanPaths = (value: unknown): void => {
        if (typeof value === 'string') {
          // Hỗ trợ /uploads/a.jpg, uploads/a.jpg
          // và URL có chứa đường dẫn /uploads/a.jpg.
          const match = value.match(/(?:^|\/)uploads\/(.+)$/i);

          if (match) {
            let relativePath = match[1];

            try {
              relativePath = decodeURIComponent(relativePath);
            } catch {
              // Bỏ qua đường dẫn mã hóa không hợp lệ.
              return;
            }

            const segments = relativePath.split(/[\\/]+/);

            if (
              segments.length > 0 &&
              segments.every(
                (part) => part.length > 0 && part !== '.' && part !== '..',
              )
            ) {
              referencedPaths.add(segments.join('/'));
            }
          }

          return;
        }

        if (Array.isArray(value)) {
          value.forEach(scanPaths);
          return;
        }

        if (value && typeof value === 'object') {
          Object.values(value as Record<string, unknown>).forEach(scanPaths);
        }
      };

      scanPaths(data);

      // STORAGE_DIR phải giống thư mục được cấu hình ở main.ts.
      const storageDir = resolve(
        process.env.STORAGE_DIR || join(process.cwd(), 'uploads'),
      );

      const files: Array<{
        originalPath: string;
        archivePath: string;
      }> = [];

      for (const relativePath of referencedPaths) {
        const absolutePath = resolve(storageDir, relativePath);

        // Chặn đường dẫn thoát khỏi thư mục uploads.
        if (!absolutePath.startsWith(storageDir + sep)) {
          continue;
        }

        if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
          continue;
        }

        files.push({
          originalPath: `/uploads/${relativePath}`,
          archivePath: `uploads/${relativePath}`,
        });
      }

      // 3. Tạo file ZIP
      const archive = archiver('zip', {
        zlib: { level: 6 },
      });

      const output = new PassThrough();
      const chunks: Buffer[] = [];

      output.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      const completed = new Promise<Buffer>((resolve, reject) => {
        output.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        output.on('error', reject);
        archive.on('error', reject);
      });

      archive.pipe(output);

      archive.append(
        JSON.stringify(
          {
            formatVersion: 1,
            tenantId,
            exportedAt: new Date().toISOString(),
            tables: Object.keys(data),
            files,
          },
          null,
          2,
        ),
        { name: 'manifest.json' },
      );

      archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });

      // 4. Đưa ảnh và file được tham chiếu vào cùng ZIP
      for (const file of files) {
        const relativePath = file.archivePath.slice('uploads/'.length);
        const absolutePath = resolve(storageDir, relativePath);

        archive.file(absolutePath, {
          name: file.archivePath,
        });
      }

      await archive.finalize();

      return await completed;
    } finally {
      await runner.release();
    }
  }
}
