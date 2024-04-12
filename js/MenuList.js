"use strict";
/*** REGION 1 - Global variables - Vùng khai báo biến, hằng số, tham số TOÀN CỤC */
// Tổng số bản ghi của hệ thống
var gTotalOrders = 0; //lát gán sau

// Tham số limit (Số lượng bản ghi tối đa trên 1 trang)
var gPerpage = 2;

// // Tổng số trang. Math ceil để lấy số sản phẩm tối đa có được. Ví dụ: 10 / 3 = 3.33 => Cần 4 trang hiển thị
// var gTotalPages = Math.ceil(gTotalOrders / gPerpage);
/*** REGION 2 - Vùng gán / thực thi sự kiện cho các elements */
$(document).ready(function () {
  // Thực hiện xử lý hiển thị của trang đầu tiên
  // Các trang tiếp theo gán onclick trong nút phân trang và gọi tương tự trang đầu tiên
  createPage(1);
});
/*** REGION 3 - Event handlers - Vùng khai báo các hàm xử lý sự kiện */

/*** REGION 4 - Common funtions - Vùng khai báo hàm dùng chung trong toàn bộ chương trình*/
// Hàm xử lý tạo trang(dùng async await)
async function createPage(paramPagenum) {
  "use strict";
  try {//thực hiện khối mã, nếu có lỗi nhảy ngay sang catch(khác với then chỉ thực hiện khi promise thành công)
    //nên dùng try để xứ lý, đặc biệt khi có nhiều promise
    //then ngắn gọn chỉ nên dùng khi có ít promise cần xử lý
    // Gọi và chờ hàm call API get orders và xử lý hiển thị dựa vào 2 tham số phân trang
    await callAPIGetOrdersPagination(gPerpage, paramPagenum);
    // Gọi hàm tạo thanh phân trang
    createPagination(paramPagenum);
  } catch {
    console.log(paramError);
  }
}

// Hàm call API get orders và xử lý hiển thị dựa vào 2 tham số phân trang
function callAPIGetOrdersPagination(paramPerpage, paramPagenum) {
  "use strict";
  const vQueryParams = new URLSearchParams({
    _limit: paramPerpage,
    _page: paramPagenum - 1,
  });
  //Dùng Promise xử lý bất đồng bộ(ko dùng when Jquery vì ko muốn phải truyền thêm tham số Defferer)
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "get",
      url:
        "https://food-ordering-fvo9.onrender.com/api/foods?" +
        vQueryParams.toString(),
      dataType: "json",
      success: function (paramData) {
        console.log(paramData);
        displayDataGetOrdersPagination(paramData); //Gọi hàm xử lý hiển thị lấy danh sách Orders phân trang
        resolve(paramData); //Trả về resolve
      },
      error: function (paramError) {
        console.log(paramError);
        reject(paramError); //Trả về reject
      },
    });
  });
}

// Hàm xử lý hiển thị lấy danh sách Orders phân trang
function displayDataGetOrdersPagination(paramData) {
  "use strict";
  gTotalOrders = paramData.count; //Gán giá trị cho biến toàn cục tổng số order lấy đc
  //Xóa trắng danh sách cũ
  $("#product-container").html("");
  //Dùng Object.values đổi giá trị order trả về thành 1 mảng để dùng forEach
  let vOrdersArr = Object.values(paramData.rows);
  console.log(vOrdersArr);
  //Chạy vòng lặp xử lý hiển thị với data trả về
  vOrdersArr.forEach((paramOrder) => {
    //Với mỗi order sẽ tiến hành tạo 1 phần tử con để hiển thị
    $("#product-container").append(`
        <div class="Product-card col-12 col-md-6 col-lg-4 mb-4">
        <div class="product-card-image" style="background-image: url('${paramOrder.imageUrl}'); background-position: center; background-size: cover; background-repeat: no-repeat;">
          <div class="discount">50%</div>
        </div>
        <div class="product-id d-none">${paramOrder.id}</div>
        <div class="product-imageUrl d-none">
        ${paramOrder.imageUrl}
        </div>
        <div class="product-createdAt d-none">
        ${paramOrder.createdAt}
        </div>
        <div class="product-updatedAt d-none">
        ${paramOrder.updatedAt}
        </div>
        <div class="product-card-details">
          <div class="product-card-details-content">
            <div class="row">
              <div class="product-name">${paramOrder.name}</div>
              <div class="product-price">
                $<span>${paramOrder.price}</span>
              </div>
            </div>
            <div class="row">
              <div>
                <div class="card-rating">
                  <img
                    src="images/ant-design_star-filled.png"
                    alt="rating star"
                  />
                  <div class="card-rating-number">
                  ${paramOrder.rating}
                  </div>
                </div>
                <div class="card-cooking-time">
                ${paramOrder.time}
                </div>
              </div>
              <img
                src="images/iconoir_add-to-cart.png"
                alt="add-to-cart"
                class="add-to-cart btn"
              />
            </div>
          </div>
        </div>
      </div>
        `);
  });
}

// Hàm xử lý tạo thanh phân trang
function createPagination(paramPagenum) {
  "use strict";
  // Xóa trắng phần tử chứa thanh phân trang cũ
  $("#pagination-container").html("");
  // Tổng số trang. Math ceil để lấy số sản phẩm tối đa có được. Ví dụ: 10 / 3 = 3.33 => Cần 4 trang hiển thị
  // Khai báo ở đây để chờ gTotalOrders được gán giá trị xong
  let vTotalPages = Math.ceil(gTotalOrders / gPerpage);

  // Mảng chứa các trang cần hiển thị
  let vPagesToDisplayArr = calculateAllPagesToDisplay(vTotalPages);

  // Lặp qua mảng chứa các trang cần hiển thị
  for (let bI = 0; bI < vPagesToDisplayArr.length; bI++) {
    let vPageNumber = vPagesToDisplayArr[bI]; //Biến chứa số trang
    //Khai báo biến trạng thái để kiểm tra trang hiện tại
    let isActive = vPageNumber === paramPagenum; // nhận giá trị true false

    // Thêm nút vào thanh phân trang
    appendPaginationItem(vPageNumber, isActive);
  }
}

// Hàm xử lý tính toán số trang cần hiển thị
function calculateAllPagesToDisplay(paramTotalPageCount) {
  "use strict";
  let vPagesToDisplay = []; //Mảng rỗng dùng để lưu số trang cần hiển thị

  for (let bI = 1; bI <= paramTotalPageCount; bI++) {
    //lặp qua các số từ 1 đến giá trị của biến paramTotalPageCount(bắt đầu từ trang 1)
    vPagesToDisplay.push(bI); //thêm số trang vào mảng
  }

  return vPagesToDisplay;
}

// Hàm xử lý thêm nút vào thanh phân trang
function appendPaginationItem(paramPageNumber, paramIsActive) {
  "use strict";
  let vListItem = $("<li class='page-item'></li>"); //Khai báo thẻ li mặc định bao ngoài nút phân trang

  if (paramIsActive) {
    //Nếu trang truyền vào đc chọn(active)
    vListItem.addClass("active"); //thêm class active vào thẻ li
    vListItem.append(
      "<a href='javascript:void(0)' class='page-link' style='background-color: #1AC073; border-color: #1AC073'>" +
        paramPageNumber +
        "</a>"
    ); //thêm nút với css active
  } else {
    vListItem.append(
      "<a href='javascript:void(0)' class='page-link' onclick='createPage(" +
        paramPageNumber +
        ")'>" +
        paramPageNumber +
        "</a>"
    ); //thêm nút với css mặc định
  }

  $("#pagination-container").append(vListItem); //add thẻ li mới vào thanh phân trang
}
