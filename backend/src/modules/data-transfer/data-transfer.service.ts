import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import archiver from 'archiver';
import { PassThrough } from 'stream';

@Injectable()
export class DataTransferService {
  constructor(private readonly dataSource: DataSource) {}

  async exportTenant(tenantId: string): Promise<Buffer> {
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();

    try {
      const tenantRows = await runner.query(
        'SELECT * FROM "tenant" WHERE "id" = $1',
        [tenantId],
      );

      if (!tenantRows.length) {
        throw new NotFoundException('Không tìm thấy tenant.');
      }

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

      const data: Record<string, unknown> = {
        tenant: tenantRows[0],
      };

      for (const table of tables) {
        data[table] = await runner.query(
          `SELECT * FROM "${table}" WHERE "tenant_id" = $1`,
          [tenantId],
        );
      }

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
          },
          null,
          2,
        ),
        { name: 'manifest.json' },
      );

      archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });

      await archive.finalize();

      return await completed;
    } finally {
      await runner.release();
    }
  }
}
