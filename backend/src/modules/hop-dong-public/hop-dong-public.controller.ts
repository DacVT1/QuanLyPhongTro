import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { HopDongPublicService } from './hop-dong-public.service';

@Controller('public/hop-dong')
export class HopDongPublicController {
  constructor(private readonly hopDongPublicService: HopDongPublicService) {}

  /**
   * Public API.
   *
   * Không yêu cầu đăng nhập.
   *
   * GET /api/public/hop-dong/data
   */
  @Get('data')
  getData() {
    return this.hopDongPublicService.getData();
  }

  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'cccdMatTruoc',
        maxCount: 1,
      },
      {
        name: 'cccdMatSau',
        maxCount: 1,
      },
    ]),
  )
  async submitContract(
    @Body() body: any,
    @UploadedFiles()
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
    return this.hopDongPublicService.submitContract(body, files);
  }

  @Post('request-verification')
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'cccdMatTruoc',
        maxCount: 1,
      },
      {
        name: 'cccdMatSau',
        maxCount: 1,
      },
    ]),
  )
  async requestVerification(
    @Body() body: any,
    @UploadedFiles()
    files: {
      cccdMatTruoc?: Express.Multer.File[];
      cccdMatSau?: Express.Multer.File[];
    },
  ) {
    return this.hopDongPublicService.requestVerification(body, files);
  }

  @Post('verify')
  async verifyContract(
    @Body()
    body: {
      verificationId: string;
      code: string;
    },
  ) {
    return this.hopDongPublicService.verifyContract(
      body.verificationId,
      body.code,
    );
  }
}
