import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'Quản lý nhà trọ API',
      version: '1.0.0',
      status: 'running',
      docs: '/api/docs',
      endpoints: {
        nhaTro: '/api/nha-tro',
        phong: '/api/phong',
        giuong: '/api/giuong',
        nguoiThue: '/api/nguoi-thue',
        hopDong: '/api/hop-dong',
        hoaDon: '/api/hoa-don',
        dashboard: '/api/dashboard/summary',
      },
    };
  }
}
