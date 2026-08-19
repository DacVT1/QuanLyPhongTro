import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import { NguoiThueService } from './nguoi-thue.service';

@Controller('nguoi-thue')
export class NguoiThueController {
  constructor(
    private readonly nguoiThueService: NguoiThueService,
  ) {}

  @Get()
  findAll() {
    return this.nguoiThueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nguoiThueService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cccdMatTruoc',
          maxCount: 1,
        },
        {
          name: 'cccdMatSau',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: join(
            process.cwd(),
            'uploads',
            'nguoi-thue',
          ),

          filename: (_req, file, cb) => {
            const extension = extname(
              file.originalname,
            );

            cb(
              null,
              `${randomUUID()}${extension}`,
            );
          },
        }),

        fileFilter: (_req, file, cb) => {
          if (
            !file.mimetype.startsWith('image/')
          ) {
            return cb(
              new Error(
                'Chi cho phep upload file anh',
              ),
              false,
            );
          }

          cb(null, true);
        },

        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  create(
    @Body() payload: any,
    @UploadedFiles()
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
    if (files?.cccdMatTruoc?.[0]) {
      payload.cccdMatTruoc =
        `/uploads/nguoi-thue/${files.cccdMatTruoc[0].filename}`;
    }

    if (files?.cccdMatSau?.[0]) {
      payload.cccdMatSau =
        `/uploads/nguoi-thue/${files.cccdMatSau[0].filename}`;
    }

    return this.nguoiThueService.create(payload);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cccdMatTruoc',
          maxCount: 1,
        },
        {
          name: 'cccdMatSau',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: join(
            process.cwd(),
            'uploads',
            'nguoi-thue',
          ),

          filename: (_req, file, cb) => {
            const extension = extname(
              file.originalname,
            );

            cb(
              null,
              `${randomUUID()}${extension}`,
            );
          },
        }),

        fileFilter: (_req, file, cb) => {
          if (
            !file.mimetype.startsWith('image/')
          ) {
            return cb(
              new Error(
                'Chi cho phep upload file anh',
              ),
              false,
            );
          }

          cb(null, true);
        },

        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() payload: any,
    @UploadedFiles()
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
    if (files?.cccdMatTruoc?.[0]) {
      payload.cccdMatTruoc =
        `/uploads/nguoi-thue/${files.cccdMatTruoc[0].filename}`;
    }

    if (files?.cccdMatSau?.[0]) {
      payload.cccdMatSau =
        `/uploads/nguoi-thue/${files.cccdMatSau[0].filename}`;
    }

    return this.nguoiThueService.update(
      id,
      payload,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nguoiThueService.remove(id);
  }
}