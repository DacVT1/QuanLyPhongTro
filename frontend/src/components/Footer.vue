<template>
  <footer class="site-footer">
    <div class="footer-pattern">
      <div class="footer-container">

        <!-- Logo / hình ảnh -->
        <div class="footer-image">
          <img
            src="/images/avatar.jpg"
            alt="Thông tin hệ thống"
          />
        </div>

        <!-- Thông tin chính -->
        <div class="footer-main">
          <h3>
            HỆ THỐNG QUẢN LÝ DỮ LIỆU NHÀ TRỌ
          </h3>

          <p>
            Người tạo: <strong>Mr DUCK</strong>
          </p>

          <p>
            Địa chỉ:
            <strong>
              Cầu Giấy - Hà Nội
            </strong>
          </p>

          <p>
            Thông tin giới thiệu
            <strong>
              "https://vu-trong-dac-portfolio.vercel.app/"
            </strong>
          </p>
        </div>

        <!-- Hỗ trợ -->
        <div class="footer-support">

          <p>
            Điện thoại:
            <strong>0945240518</strong>
          </p>

          <p>
            Zalo:
            <strong>0945240518</strong>
          </p>

          <p>
            Thư điện tử:
            <strong>trongdac18071999@gmail.com</strong>
          </p>
        </div>

      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  margin-top: 30px;
  background: #dceeff;
  border-top: 1px solid #c8dff5;
}

.footer-pattern {
  width: 100%;
  min-height: 150px;

  background-color: #dceeff;

  /*
   * Tạo họa tiết nhẹ tương tự ảnh mẫu.
   */
  background-image:
    linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.18) 25%,
      transparent 25%
    ),
    linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.18) 25%,
      transparent 25%
    );

  background-size: 70px 70px;
}

.footer-container {
  width: min(1100px, calc(100% - 40px));
  min-height: 150px;

  margin: 0 auto;
  padding: 16px 0;

  display: flex;
  align-items: center;
  gap: 28px;

  box-sizing: border-box;
}

/* =========================
   HÌNH ẢNH
   ========================= */

.footer-image {
  flex: 0 0 140px;
  width: 140px;
  height: 92px;

  overflow: hidden;
  border-radius: 6px;

  background: #fff;
}

.footer-image img {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;
}

/* =========================
   THÔNG TIN CHÍNH
   ========================= */

.footer-main {
  flex: 1;
  min-width: 0;
}

.footer-main h3 {
  margin: 0 0 8px;

  color: #0071bc;

  font-size: 18px;
  font-weight: 700;

  line-height: 1.3;
}

.footer-main p,
.footer-support p {
  margin: 4px 0;

  color: #202020;

  font-size: 13px;
  line-height: 1.45;
}

.footer-main strong,
.footer-support strong {
  font-weight: 700;
}

/* =========================
   HỖ TRỢ
   ========================= */

.footer-support {
  flex: 0 0 310px;
}

.footer-support p:first-child {
  margin-top: 0;
}

/* =========================
   RESPONSIVE
   ========================= */

@media (max-width: 900px) {
  .footer-container {
    width: min(100% - 30px, 700px);

    flex-wrap: wrap;
    gap: 16px;
  }

  .footer-image {
    flex: 0 0 120px;
    width: 120px;
    height: 80px;
  }

  .footer-main {
    flex: 1;
  }

  .footer-support {
    flex: 1 1 100%;
    padding-left: 136px;
  }
}

@media (max-width: 600px) {
  .footer-container {
    width: calc(100% - 24px);

    display: block;

    padding: 20px 0;
  }

  .footer-image {
    width: 130px;
    height: 85px;

    margin-bottom: 14px;
  }

  .footer-main h3 {
    font-size: 15px;
  }

  .footer-main p,
  .footer-support p {
    font-size: 12px;
  }

  .footer-support {
    padding-left: 0;
    margin-top: 14px;
  }
}
</style>