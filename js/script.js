"use strict";
/*** REGION 1 - Global variables - Vùng khai báo biến, hằng số, tham số TOÀN CỤC */
// Khai báo đối tượng global để lưu giá trị input question
var gQuestionObj = {
  name: "",
  email: "",
  message: "",
};

// URL API
var gBASE_URL = "https://food-ordering-fvo9.onrender.com/api";

//Khởi tạo biến global chứa thông tin items
//Kiểm tra "products" tồn tại chưa, nếu rồi thì parse ra và gán còn chưa thì tạo mới mảng rỗng
var gProductsArray = localStorage.getItem("products")
  ? JSON.parse(localStorage.getItem("products"))
  : [];
//Lưu lại giá trị cho products vào trong localstorage
localStorage.setItem("products", JSON.stringify(gProductsArray));

/*** REGION 2 - Vùng gán / thực thi sự kiện cho các elements */
// Khi DOM load xong
$(document).ready(function () {
  //Tải trang
  onPageLoading();

  // Khi có sự kiện click trên document, Lắng nghe xem có phải sự kiện bấm vào icon tìm kiếm trên thanh navbar hay bấm ra ngoài
  $(document).click(function (event) {
    displayInputSearch(event);
  });

  // Lắng nghe sự kiện click nút filter
  $(".Filter-button .btn").click(function (event) {
    //event.target trả về đối tượng xảy ra sự kiện
    changeStyleButtonFilter(event.target);
    changeSelectFilter(event.target);
  });

  // Lắng nghe sự kiện select filter
  $("#select-filter").on("change", function (event) {
    changeButtonFilter(event.target);
  });

  // Kích hoạt tooltip
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });

  // Lắng nghe sự kiện click nút send question
  $("#btn-send-question").click(function (event) {
    event.preventDefault();
    //B1: Thu thập dữ liệu input
    collectDataQuestionInput();
    //B2: Kiểm tra dữ liệu input
    let vCheck = validateDataQuestionInput();
    if (vCheck) {
      //B3: Call API và xử lý hiển thị(chưa có call API)
      displayDataQuestionInputToWeb();
    }
  });

  // Lắng nghe sự kiện ấn nút thêm vào giỏ hàng
  $(".Product-card").on("click", ".add-to-cart", function () {
    onIconAddProductToCartClick(this);
  });

  // Lắng nghe sự kiện thay đổi trong localStorage để khi có sự thay đổi trong 1 tab khác(ví dụ xóa đơn hàng) thì tab chính sẽ tự cập nhật được
  // storage là sự kiện được kích hoạt khi có sự thay đổi trong localStorage hoặc sessionStorage
  // Sự kiện "storage" chỉ được kích hoạt khi có sự thay đổi trong localStorage từ một tab hoặc cửa sổ trình duyệt khác
  // Window là đối tượng bao hàm toàn bộ trang web(lớn hơn document chỉ bao gồm cấu trúc html)
  // khi bạn thay đổi localStorage trực tiếp trong console mà không thông qua các sự kiện được kích hoạt từ các tab hoặc cửa sổ trình duyệt khác, các hàm lắng nghe sự kiện "storage" sẽ không được kích hoạt.
  // Điều này là bảo mật để ngăn chặn các mã độc hại thay đổi localStorage của trang web mà không có sự thông báo hoặc xử lý phù hợp.
  $(window).on("storage", function (event) {
    if (event.originalEvent.key === "products") {
      // Kiểm tra xem sự thay đổi có phải là products ko(thêm xóa)
      // Gọi hàm tải trang để cập nhật cùng lúc cả danh sách và màu icon, gProductsArray
      onPageLoading();
    }
  });

  // Lắng nghe sự kiện ấn nút giỏ hàng
  $("#custom-icon-shopping-bag").on("click", function () {
    // mở trong 1 cửa sổ mới, mặc định là _blank
    // window.open("MyCart.html", "_blank");
    window.open("MyCart.html");
  });
});

/*** REGION 3 - Event handlers - Vùng khai báo các hàm xử lý sự kiện */
// Hàm xử lý sự kiện load trang
function onPageLoading() {
  "use strict";
  // Cập nhật giá trị mới cho gProductsArray khi có thay đổi trong localStorage
  gProductsArray = JSON.parse(localStorage.getItem("products")) || [];
  // Gọi hàm call API load danh sách Product
  callAPIGetPizzaList();
  // Gọi hàm call API load danh sách Blog
  callAPIGetBlogsList();
  // Gọi ở đây để khi load trang cái là đổi màu ngay
  changeColorIconBag();
}

// Hàm xử lý sự kiện ấn icon add product to cart
function onIconAddProductToCartClick(paramIcon) {
  "use strict";
  // B0: Khai báo đối tượng lưu dữ liệu để add vào giỏ hàng
  // Khai báo đối tượng trong scope hàm để tránh chia sẻ dữ liệu mỗi lần add thêm thông tin vào localStorage
  // Chỉ nên khai báo global mới những biến, đối tượng có thể tái sử dụng nhiều lần mà ko sợ nhầm lẫn
  let vProductObj = {
    id: "",
    name: "",
    imageUrl: "",
    price: "",
    rating: "",
    time: "",
    createdAt: "",
    updatedAt: "",
    qty: 1,
  };
  //B1: Thu thập dữ liệu
  collectDataAddProductToCart(paramIcon, vProductObj);
  //B2: Kiếm tra dữ liệu
  let vCheck = validateDataAddProductToCart(vProductObj);
  if (vCheck) {
    //B3: Xử lý front-end
    addDataAddProductToCartToLocalStorage(vProductObj);
    // Gọi ở đây để khi bấm thêm cái là đổi màu ngay
    changeColorIconBag();
  }
}

/*** REGION 4 - Common funtions - Vùng khai báo hàm dùng chung trong toàn bộ chương trình*/
// Hàm xử lý call API get list pizza
function callAPIGetPizzaList() {
  "use strict";
  $.ajax({
    url: gBASE_URL + "/foods",
    type: "GET",
    dataType: "json",
    success: displayListPizzaToWeb,
    error: displayErrorToWeb,
  });
}

// Hàm xử lý call API get list blogs
function callAPIGetBlogsList() {
  "use strict";
  $.ajax({
    url: gBASE_URL + "/blogs",
    type: "GET",
    dataType: "json",
    success: displayListBlogsToWeb,
    error: displayErrorToWeb,
  });
}

// Hàm xử lý hiển thị list pizza to web
function displayListPizzaToWeb(paramResponse) {
  "use strict";
  let vCardsHome = $(".Kitchen").find(".Cards-home");
  for (let bI = 0; bI < paramResponse.rows.length; bI++) {
    vCardsHome
      .find(".product-card-image")
      .eq(bI)
      .css(
        "background-image",
        "url('" + paramResponse.rows[bI].imageUrl + "')"
      );

    vCardsHome
      .find(".product-name")
      .eq(bI)
      .html(paramResponse.rows[bI].name)
      .attr({
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        title: paramResponse.rows[bI].name,
      });

    vCardsHome
      .find(".product-price")
      .eq(bI)
      .find("span")
      .html(paramResponse.rows[bI].price);

    vCardsHome
      .find(".card-rating-number")
      .eq(bI)
      .html(paramResponse.rows[bI].rating);
    vCardsHome
      .find(".card-cooking-time")
      .eq(bI)
      .html(paramResponse.rows[bI].time);
    vCardsHome.find(".product-id").eq(bI).html(paramResponse.rows[bI].id);
    vCardsHome
      .find(".product-imageUrl")
      .eq(bI)
      .html(paramResponse.rows[bI].imageUrl);
    vCardsHome
      .find(".product-createdAt")
      .eq(bI)
      .html(paramResponse.rows[bI].createdAt);
    vCardsHome
      .find(".product-updatedAt")
      .eq(bI)
      .html(paramResponse.rows[bI].updatedAt);
  }
}

// Hàm xử lý hiển thị list blogs to web
function displayListBlogsToWeb(paramResponse) {
  "use strict";
  let vBlogCards = $(".Blog").find(".Blog-cards");
  for (let bI = 0; bI < paramResponse.length; bI++) {
    vBlogCards
      .find(".Blog-card-image")
      .eq(bI)
      .css("background-image", "url('" + paramResponse[bI].imageUrl + "')");

    vBlogCards
      .find(".Blog-card-detail-title")
      .eq(bI)
      .html(paramResponse[bI].title)
      .attr({
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        title: paramResponse[bI].title,
      });

    vBlogCards
      .find(".Blog-card-detail-description")
      .eq(bI)
      .html(paramResponse[bI].description)
      .attr({
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        title: paramResponse[bI].description,
      });
  }
}

// Hàm xử lý hiển thị khi get list pizza bị lỗi
function displayErrorToWeb(paramError) {
  "use strict";
  console.log(paramError.responseText);
  alert("Có lỗi xảy ra, vui lòng tải lại trang");
}

// Hàm xử lý hiển thị ô tìm kiếm trên thanh navbar
function displayInputSearch(paramEvent) {
  "use strict";
  // C1: dùng closest trả về giá trị lọc phần tử xem có = 0 ko
  // Nếu sự kiện click không nằm trong thẻ input hoặc hình ảnh
  if (
    $(paramEvent.target).closest(
      "#custom-input-search-navbar, #custom-icon-search-navbar"
    ).length === 0
  ) {
    // Ẩn thẻ input bằng display none để phần tử ko chiếm dụng không gian trên web, visibility và opacity vẫn chiếm dụng
    $("#custom-input-search-navbar").css("display", "none");
  } else {
    $("#custom-input-search-navbar").css("display", "block");
  }

  //C2: Dùng event.target.id trả về giá trị của thuộc tính id của phần tử mà sự kiện đã xảy ra trên đó
  //Lấy id của phần tử được click
  // var clickedElementId = paramEvent.target.id;

  // // Kiểm tra xem sự kiện click có xảy ra trên một trong hai phần tử không
  // if (clickedElementId === "custom-input-search-navbar" || clickedElementId === "custom-icon-search-navbar") {
  //     // Sự kiện click xảy ra trên một trong hai phần tử
  //     $("#custom-input-search-navbar").css("display", "none");
  // } else {
  //     // Sự kiện click không xảy ra trên cả hai phần tử
  //     $("#custom-input-search-navbar").css("display", "block");
  // }
}

// Hàm xử lý sự kiện bấm nút filter
function changeStyleButtonFilter(paramButton) {
  "use strict";
  // Loại bỏ lớp 'button-selected' khỏi tất cả các nút
  $(".Filter-button .btn").removeClass("button-selected");

  // Thêm lớp 'button-selected' cho nút được nhấp vào
  // event là sự kiện, event.target là phần tử xảy ra sự kiện
  $(paramButton).addClass("button-selected");
}
// Hàm xử lý sự kiện thay đổi select filter theo nút filter đc bấm
function changeSelectFilter(paramButton) {
  "use strict";
  // Lấy giá trị html của button
  let vButtonText = $(paramButton).html();
  // Gán giá trị đó cho thẻ select để lấy ra option tương ứng
  $("#select-filter").val(vButtonText);
}

// Hàm xử lý thay đổi button filter theo select filter
function changeButtonFilter(paramSelect) {
  "use strict";
  // Lấy giá trị value của thẻ select
  let vSelectFilterValue = $(paramSelect).val();
  // Truy vấn và lấy ra giá trị tập hợp các button filter
  let vButtonArray = $(".Filter-button .btn");
  //dùng vòng lặp for để tìm kiếm button tương ứng
  for (let bI = 0; bI < vButtonArray.length; bI++) {
    if (vSelectFilterValue == $(vButtonArray[bI]).html()) {
      changeStyleButtonFilter(vButtonArray[bI]);
    }
  }
}

// Hàm xử lý thu thập dữ liệu sản phẩm khi ấn add to cart
function collectDataAddProductToCart(paramIcon, paramProductObj) {
  "use strict";
  let vCard = $(paramIcon).closest(".Product-card"); //Tìm đến thẻ cha Product-card gần nhất
  //gán dữ liệu cho object
  paramProductObj.id = vCard.find(".product-id").html();
  paramProductObj.imageUrl = vCard.find(".product-imageUrl").html();
  paramProductObj.name = vCard.find(".product-name").html();
  paramProductObj.price = vCard.find(".product-price").find("span").html();
  paramProductObj.rating = vCard.find(".card-rating-number").html();
  paramProductObj.time = vCard.find(".card-cooking-time").html();
  paramProductObj.createdAt = vCard.find(".product-createdAt").html();
  paramProductObj.updatedAt = vCard.find(".product-updatedAt").html();
  //chạy vòng lặp while xem gProductsArray đã có sản phẩm vừa thêm chưa
  //nếu có rồi thì +1 thêm vào qty mới và xóa cái cũ đi, nếu chưa có thì sử dụng mặc định ban đầu là 1
  let vFound = false;
  let vIndex = 0;
  while (!vFound && vIndex < gProductsArray.length) {
    if (paramProductObj.id == gProductsArray[vIndex].id) {
      paramProductObj.qty += gProductsArray[vIndex].qty; //cộng thêm 1 vào qty
      gProductsArray.splice(vIndex, 1); //xóa đối tượng cũ đi khỏi mảng
      vFound = true;
    } else {
      vIndex++;
    }
  }
}

// Hàm xử lý kiểm tra dữ liệu sản phẩm khi ấn add to cart
function validateDataAddProductToCart(paramProductObj) {
  "use strict";
  if (paramProductObj.id == "Viết Id pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.imageUrl == "Viết imageUrl pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.name == "Viết tên pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.price == "Viết giá tiền pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.rating == "Viết số đánh giá sao của khách hàng vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.time == "Viết độ dài chờ để nướng bánh vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.createdAt == "Viết createdAt pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  if (paramProductObj.updatedAt == "Viết updatedAt pizza vào đây") {
    alert("Không tìm thấy sản phẩm tương ứng");
    return false;
  }
  return true;
}

// Hàm xử lý front-end thêm dữ liệu product đã chọn vào localStorage
function addDataAddProductToCartToLocalStorage(paramProductObj) {
  "use strict";
  alert("Thêm sản phẩm vào giỏ hàng thành công");
  // Đính thêm đối tượng chứ thông tin product được chọn vào mảng chứa thông tin giỏ hàng
  gProductsArray.push(paramProductObj);
  // Gán lại giá trị mảng chứa thông tin giỏ hàng trong LocalStorage
  localStorage.setItem("products", JSON.stringify(gProductsArray));
}

// Hàm xử lý sự kiện thu thập dữ liệu question input
function collectDataQuestionInput() {
  "use strict";
  gQuestionObj.name = $.trim($("#input-name").val());
  gQuestionObj.email = $.trim($("#input-email").val());
  gQuestionObj.message = $.trim($("#input-message").val());
}

// Hàm xử lý đổi màu icon giỏ hàng khi có sản phẩm
function changeColorIconBag() {
  "use strict";
  // Khởi tạo lại mảng chứa thông tin products vì mảng global chưa được đồng bộ thông tin(nó chỉ đồng bộ khi click nút thêm product)
  let vProductsArray = localStorage.getItem("products")
    ? JSON.parse(localStorage.getItem("products"))
    : [];
  // Nếu mảng ko rỗng thì màu vàng
  if (vProductsArray.length > 0) {
    $("#custom-icon-shopping-bag").attr(
      "src",
      "images/akar-icons_shopping-bag-loaded.png"
    );
  } else {
    //rỗng thì màu trắng
    $("#custom-icon-shopping-bag").attr(
      "src",
      "images/akar-icons_shopping-bag-empty.png"
    );
  }
}

// Hàm kiểm tra dữ liệu question input
function validateDataQuestionInput() {
  "use strict";
  if (gQuestionObj.name == "") {
    alert("Bạn chưa nhập tên");
    return false;
  }

  if (gQuestionObj.email == "") {
    alert("Bạn chưa nhập email");
    return false;
  }

  let vCheck = validateEmail(gQuestionObj.email);
  if (!vCheck) {
    alert("Email không đúng định dạng");
    return false;
  }

  if (gQuestionObj.message == "") {
    alert("Bạn chưa nhập lời nhắn");
    return false;
  }

  if (gQuestionObj.message.length < 20) {
    alert("Lời nhắn không được ngắn hơn 20 kí tự");
    return false;
  }
  return true;
}

/*hàm kiểm tra email
    Nếu khớp, test() trả về true; nếu không khớp, nó trả về false.
    */
function validateEmail(paramEmail) {
  "use strict";
  let vFormatReg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let vCheck = vFormatReg.test(paramEmail);
  return vCheck;
}

// Hàm xử lý hiển thị dữ liệu question input thành công
function displayDataQuestionInputToWeb() {
  "use strict";
  alert("Gửi câu hỏi thành công. Chúng tôi sẽ liên hệ lại trong 48h giờ tới.");
  console.log(
    "Name: " +
      gQuestionObj.name +
      "\n" +
      "Email: " +
      gQuestionObj.email +
      "\n" +
      "Message: " +
      gQuestionObj.message
  );
}
