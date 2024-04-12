$(document).ready(function () {
  "use strict";
  /*** REGION 1 - Global variables - Vùng khai báo biến, hằng số, tham số TOÀN CỤC */
  //URL call API
  var gBASE_URL = "https://food-ordering-fvo9.onrender.com/api";

  // Khai báo biến global lưu giá trị voucherId, mỗi lần tải trang sẽ load lại từ đầu
  // Ko lưu vào local vì voucher phải cập nhật mới, tránh người dùng lạm dụng nhiều lần
  var gVoucherId = "";

  // Khởi tạo mảng lưu giá trị trong localStorage, nếu có thì parse ra obj, ko thì tạo mảng rỗng
  var gProductsArray = localStorage.getItem("products")
    ? JSON.parse(localStorage.getItem("products"))
    : [];
  // Lưu lại giá trị cho products vào localStorage
  localStorage.setItem("products", JSON.stringify(gProductsArray));

  // Khai báo các hằng số chứa thông tin mặc định về các cột
  const gDATA_COLUMN = ["product", "totalPrice", "qty", "price"];
  const gPRODUCT_COL = 0;
  const gPRICE_COL = 1;
  const gQTY_COL = 2;
  const gUNIT_PRICE_COL = 3;

  // Cấu hình bảng khởi tạo DataTable
  $("#product-cart-table").DataTable({
    searching: false,
    ordering: false,
    paging: false,
    info: false,
    columns: [
      { data: gDATA_COLUMN[gPRODUCT_COL], width: "40%" },
      { data: gDATA_COLUMN[gPRICE_COL], width: "20%" },
      { data: gDATA_COLUMN[gQTY_COL], width: "20%" },
      { data: gDATA_COLUMN[gUNIT_PRICE_COL], width: "20%" },
    ],
    columnDefs: [
      {
        targets: gPRODUCT_COL,
        render: renderProductCol,
      },
      {
        targets: gPRICE_COL,
        render: renderPriceCol,
      },
      {
        targets: gQTY_COL,
        render: renderQtyCol,
      },
      {
        targets: gUNIT_PRICE_COL,
        render: renderUnitPriceCol,
      },
    ],
  });

  /*** REGION 2 - Vùng gán / thực thi sự kiện cho các elements */
  //lần đầu tải trang
  onPageLoading();

  // Lắng nghe sự kiện ấn icon trừ
  $("#product-cart-table tbody").on("click", ".icon-minus", function () {
    onIconMinusClick(this);
  });

  // Lắng nghe sự kiện ấn icon cộng
  $("#product-cart-table tbody").on("click", ".icon-plus", function () {
    onIconPlusClick(this);
  });

  // Lắng nghe sự kiện ấn remove item
  $("#product-cart-table tbody").on("click", ".remove-item", function () {
    onRemoveItemClick(this);
  });

  // Lắng nghe sự kiện bấm nút check voucher
  $("#btn-radeem-voucher").click(onBtnCheckVoucherClick);

  // Lắng nghe sự kiện ấn nút check out
  $("#btn-check-out").click(onBtnCheckOutClick);

  // Lắng nghe sự kiện ấn nút go to payment
  $("#btn-payment").click(onBtnGoToPaymentClick);

  // Lắng nghe sự kiện ấn nút complete
  $("#btn-complete-payment").click(onBtnCompletePaymentClick);

  // Lắng nghe sự kiện thay đổi trong localStorage để khi có sự thay đổi trong 1 tab khác(ví dụ xóa đơn hàng) thì tab chính sẽ tự cập nhật được
  $(window).on("storage", function (event) {
    if (event.originalEvent.key === "products") {
      //Kiểm tra xem sự thay đổi có phải là products ko(thêm xóa)
      //Gọi hàm tải trang để cập nhật cùng lúc cả danh sách và màu icon, gProductsArray
      onPageLoading();
    }
  });

  /*** REGION 3 - Event handlers - Vùng khai báo các hàm xử lý sự kiện */
  // Hàm xử lý sự kiện tải trang
  function onPageLoading() {
    "use strict";
    // Cập nhật giá trị mới cho gProductsArray khi có thay đổi trong localStorage
    gProductsArray = JSON.parse(localStorage.getItem("products")) || [];
    //Gọi hàm load sản phẩm vào bảng
    loadProductsToTableList();
    //gọi hàm tính tiền
    calculateTotalPrice();
    //gọi hàm change color
    changeColorIconBag();
  }

  // Hàm xử lý sự kiện bấm icon trừ
  function onIconMinusClick(paramElement) {
    "use strict";
    //B1: Thu thập dữ liệu
    let vQty = collectDataChangeQtyProduct(paramElement);
    //B2: Kiểm tra dữ liệu(bỏ qua)
    //B3: Xử lý lưu lại vào localStorage
    updateDataMinusQtyToLocalStorage(vQty);
    //B4: Tải lại trang
    onPageLoading();
  }

  // Hàm xử lý sự kiện bấm icon cộng
  function onIconPlusClick(paramElement) {
    "use strict";
    //B1: Thu thập dữ liệu
    let vQty = collectDataChangeQtyProduct(paramElement);
    //B2: Kiểm tra dữ liệu(bỏ qua)
    //B3: Xử lý lưu lại vào localStorage
    updateDataPlusQtyToLocalStorage(vQty);
    //B4: Tải lại trang
    onPageLoading();
  }

  // Hàm xử lý sự kiện bấm remove item
  function onRemoveItemClick(paramElement) {
    "use strict";
    //B1: Thu thập dữ liệu
    let vQty = collectDataChangeQtyProduct(paramElement);
    //B2: Kiểm tra dữ liệu(bỏ qua)
    //B3: Xử lý lưu lại vào localStorage
    removeItemFromLocalStorage(vQty);
    console.log(gProductsArray);
    //B4: Tải lại trang
    onPageLoading();
  }

  // Hàm xử lý sự kiện bấm nút check voucher
  function onBtnCheckVoucherClick() {
    //B0: Khai báo đối tượng lưu dữ liệu
    let vQueryVoucherCode = {
      voucherCode: "",
    };
    //B1: Thu thập dữ liệu
    collectDataCheckVoucher(vQueryVoucherCode);
    //B2: Kiểm tra dữ liệu
    let vCheck = validateDataCheckVoucher(vQueryVoucherCode);
    if (vCheck) {
      //B3: call API và xử lý front-end
      callAPICheckVoucherClick(vQueryVoucherCode);
    }
  }

  // Hàm xử lý sự kiện bấm nút check out
  function onBtnCheckOutClick() {
    "use strict";
    // Hiển thị modal
    $("#make-payment-modal").modal();
    // Gọi hàm thiết lập nút checkbox
    initializePaymentCheckboxes();
  }

  // Hàm xử lý sự kiện bấm nút go to payment
  function onBtnGoToPaymentClick() {
    "use strict";
    //B0: Khai báo đối tượng
    var vOrderCreate = {
      firstName: "",
      lastName: "",
      // Chú ý validate email
      email: "",
      address: "",
      phone: "",
      // Payment method là 1 trong 3 giá trị: CreditCard - Paypal - BankTransfer
      methodPayment: "",
      // Voucher id lấy giá trị id khi kiểm tra mã giảm giá
      voucherId: "",
      details: [], //mảng chứa thông tin về id và qty của món ăn
    };
    //B1: Thu thập dữ liệu
    collecDataCreateOder(vOrderCreate);
    //B2: Kiểm tra dữ liệu
    let vCheck = validateDataCreateOrder(vOrderCreate);
    if (vCheck) {
      //B3: call API và xử lý hiển thị
      callAPICreateOrder(vOrderCreate);
    }
  }

  // Hàm xử lý sự kiện bấm nút complete
  function onBtnCompletePaymentClick() {
    "use strict";
    $("#make-payment-modal-success").modal("hide"); //ẩn modal success
    gVoucherId = ""; //Xóa voucherId đi, tránh lạm dụng
    localStorage.clear(); //xóa thông tin giỏ hàng trong localStorage
    //load lại trang
    onPageLoading();
  }

  /*** REGION 4 - Common funtions - Vùng khai báo hàm dùng chung trong toàn bộ chương trình*/
  // Hàm xử lý load danh sách sản phẩm vào table list
  function loadProductsToTableList() {
    "use strict";
    let vTable = $("#product-cart-table").DataTable(); //tạo biến truy xuất đến datatable
    vTable.clear(); //xóa trắng bảng
    vTable.rows.add(gProductsArray); //thêm nội dung từ localStorage
    vTable.draw(); //vẽ lại bảng
  }

  // Hàm xử lý render cột product
  function renderProductCol(paramData, paramType, paramRow, paramMeta) {
    "use strict";
    return `<div class="row flex-nowrap">
    <img src="${paramRow.imageUrl}" style="width: 131px; height: 130px; margin-right: calc((46 / 1440) * 100%)">
    <div class="row">
    <span>${paramRow.name}</span>
    <span>beef patties, Iceberg lettuce,<br> American cheese, pickles, ...</span>
    </div>
    </div>`;
  }

  // Hàm xử lý render cột price
  function renderPriceCol(paramData, paramType, paramRow, paramMeta) {
    "use strict";
    let vQty = paramRow.qty;
    let vPrice = paramRow.price;
    return "$" + vQty * vPrice;
  }

  // Hàm xử lý render cột qty
  function renderQtyCol(paramData, paramType, paramRow, paramMeta) {
    "use strict";
    return `<div>
    <div class="row flex-nowrap justify-content-between align-items-center" style="background-color: #F6F7F8;width: 116.991px;">
    <img src="images/icon_minus.png" class="btn icon-minus" style="width: 35px; height: 16px;">
    <span>${paramData}</span>
    <img src="images/icon_plus.png" class="btn icon-plus">
    </div>
    <a class="text-danger text-decoration-underline btn remove-item">Remove Item</a>
    </div>`;
  }

  // Hàm xử lý render cột unit price
  function renderUnitPriceCol(paramData, paramType, paramRow, paramMeta) {
    "use strict";
    return "$" + paramData;
  }

  // Hàm thu thập dữ liệu thay đổi qty
  function collectDataChangeQtyProduct(paramElement) {
    "use strict";
    let vTable = $("#product-cart-table").DataTable();
    let vRowClick = $(paramElement).closest("tr"); //tìm tr gần nhất
    let vRowData = vTable.row(vRowClick).data(); //lấy data row đó
    let vId = vRowData.id;
    return vId;
  }

  // Hàm xử lý lưu lại dữ liệu bớt số lượng vào localStorage
  function updateDataMinusQtyToLocalStorage(paramId) {
    "use strict";
    //chạy vòng lặp while tìm trong gProductsArray sản phẩm vừa thay đổi số lượng
    let vProductObj = {};
    let vFound = false;
    let vIndex = 0;
    while (!vFound && vIndex < gProductsArray.length) {
      if (paramId == gProductsArray[vIndex].id) {
        vFound = true;
        vProductObj = gProductsArray[vIndex]; //gán đối tượng tìm thấy
        if (vProductObj.qty > 1) {
          vProductObj.qty -= 1; //trừ đi 1 qty
          //Min là 1, ko có trừ đi thành 0 hoặc âm
          //do giao diện giỏ hàng cần giữ nguyên thứ tự sản phẩm, ko như bên homepage thay đổi cập nhật mới ltuc
          gProductsArray.splice(vIndex, 1, vProductObj); //xóa đối tượng cũ đi khỏi mảng và gán đối tượng mới vào đúng chỗ đó
        } else {
          gProductsArray.splice(vIndex, 1); //xóa đối tượng cũ đi khỏi mảng và không gán thêm đối tượng
        }
      } else {
        vIndex++;
      }
    }
    // Gán lại giá trị mảng chứa thông tin giỏ hàng trong LocalStorage
    localStorage.setItem("products", JSON.stringify(gProductsArray));
  }

  // Hàm xử lý lưu lại dữ liệu tăng số lượng vào localStorage
  function updateDataPlusQtyToLocalStorage(paramId) {
    "use strict";
    //chạy vòng lặp while tìm trong gProductsArray sản phẩm vừa thay đổi số lượng
    let vProductObj = {};
    let vFound = false;
    let vIndex = 0;
    while (!vFound && vIndex < gProductsArray.length) {
      if (paramId == gProductsArray[vIndex].id) {
        vFound = true;
        vProductObj = gProductsArray[vIndex]; //gán đối tượng tìm thấy
        vProductObj.qty += 1; //cộng thêm 1 qty
        gProductsArray.splice(vIndex, 1, vProductObj); //xóa đối tượng cũ đi khỏi mảng và gán đối tượng mới vào đúng chỗ đó
      } else {
        vIndex++;
      }
    }
    // Gán lại giá trị mảng chứa thông tin giỏ hàng trong LocalStorage
    localStorage.setItem("products", JSON.stringify(gProductsArray));
  }

  // Hàm xử lý remove item ra khỏi localStorage
  function removeItemFromLocalStorage(paramId) {
    "use strict";
    //chạy vòng lặp while tìm trong gProductsArray sản phẩm vừa thay đổi số lượng
    let vFound = false;
    let vIndex = 0;
    while (!vFound && vIndex < gProductsArray.length) {
      if (paramId == gProductsArray[vIndex].id) {
        vFound = true;
        gProductsArray.splice(vIndex, 1); //xóa đối tượng cũ đi khỏi mảng
      } else {
        vIndex++;
      }
    }
    // Gán lại giá trị mảng chứa thông tin giỏ hàng trong LocalStorage
    localStorage.setItem("products", JSON.stringify(gProductsArray));
  }

  // Hàm xử lý thu thập dữ liệu check voucher
  function collectDataCheckVoucher(paramVoucher) {
    "use strict";
    paramVoucher.voucherCode = $.trim($("#input-voucher-code").val());
  }

  // Hàm xử lý kiểm tra dữ liệu check voucher
  function validateDataCheckVoucher(paramVoucher) {
    "use strict";
    if (paramVoucher.voucherCode == "") {
      alert("Vui lòng nhập voucher");
      return false;
    }
    if (isNaN(paramVoucher.voucherCode)) {
      alert("Voucher không hợp lệ");
      return false;
    }
    return true;
  }

  // Hàm xử lý call API check voucher
  function callAPICheckVoucherClick(paramVoucher) {
    "use strict";
    let vSearchParams = new URLSearchParams(paramVoucher);
    $.ajax({
      url: gBASE_URL + "/vouchers" + "?" + vSearchParams.toString(),
      type: "GET",
      dataType: "json",
      success: displayDataCheckVoucherSuccess,
      error: function (error) {
        alert("Không tìm thấy voucher, vui lòng thử lại");
        $("#input-voucher-code").val(""); //xóa trắng ô nhập voucher
        console.assert(error.responseText);
      },
    });
  }

  // Hàm xử lý hiển thị data check voucher thành công
  function displayDataCheckVoucherSuccess(paramVoucherResponse) {
    "use strict";
    if (paramVoucherResponse.length > 0) {
      alert("Thêm voucher thành công");
      $(".coupon span").html(paramVoucherResponse[0].discount); //hiển thị giá trị giảm giá vào coupon
      $("#input-voucher-code").val(""); //xóa trắng ô nhập voucher
      //gọi hàm tính toán lại tiền
      calculateTotalPrice();
      //Lưu lại giá trị voucherId để lát thanh toán
      gVoucherId = paramVoucherResponse.id;
    } else {
      alert("Không tìm thấy voucher, vui lòng thử lại");
    }
  }

  // Hàm xử lý phần tính tiền
  function calculateTotalPrice() {
    "use strict";
    //Phần tính toán
    let vSubtotal = 0;
    //chạy vòng lặp for để tính subtotal trong localStorage
    for (let bI = 0; bI < gProductsArray.length; bI++) {
      vSubtotal += gProductsArray[bI].qty * gProductsArray[bI].price;
    }
    let vShippingFee = Number($(".shipping-fee span").html()); //truy vấn và lấy giá trị phí ship
    let vCoupon = $(".coupon span").html(); //truy vấn và lấy giá trị coupon
    if (vCoupon === "No") {
      //kiểm tra xem có coupon ko
      vCoupon = 0;
    }
    let vTotal = ((vSubtotal + vShippingFee) * (100 - vCoupon)) / 100; //tính tổng giá trị

    //Phần xử lý hiển thị
    $(".subtotal span").html(vSubtotal);
    $(".total span").html(vTotal);
  }

  // Hàm xử lý thiết lập cho payment checkbox chỉ chọn được 1(giống radio)
  function initializePaymentCheckboxes() {
    "use strict";
    //Truy vấn và lấy mảng các checkbox(dùng to Array để chuyển thành mảng)
    let vCheckboxes = $(
      "#select-method-payment input[name='payment-check-box']"
    ).toArray(); //chọn tất cả thẻ input có name='payment-check-box' trong element có id select-method-payment
    //Sử dụng hàm forEach thay cho for để ngắn gọn
    vCheckboxes.forEach(function (paramCheckbox) {
      //lắng nghe sự kiện change tại mỗi checkbox trong mảng
      $(paramCheckbox).on("change", function () {
        if (this.checked) {
          //kiểm tra trạng thái checked
          //nếu checkbox đó được chọn(true)
          //thì lại lặp qua toàn bộ mảng vCheckboxes
          vCheckboxes.forEach(function (paramOtherCheckbox) {
            //Chỗ này đặt tên biến khác để dễ phân biệt thôi
            if (paramOtherCheckbox !== paramCheckbox) {
              //trừ phần tử checkbox đc chọn
              paramOtherCheckbox.checked = false;
            }
          });
        }
      });
    });
  }

  // Hàm xử lý thu thập dữ liệu create order
  function collecDataCreateOder(paramOrderObj) {
    "use strict";
    //Truy vấn các trường để lấy thông tin khách hàng rồi gán
    paramOrderObj.firstName = $.trim($("#input-firstname-payment").val());
    paramOrderObj.lastName = $.trim($("#input-lastname-payment").val());
    paramOrderObj.email = $.trim($("#input-email-payment").val());
    paramOrderObj.address = $.trim($("#input-address-payment").val());
    paramOrderObj.phone = $.trim($("#input-phone-payment").val());

    // Truy vấn các ô checkbox để xem ô nào được chọn
    //Truy vấn và lấy mảng các checkbox(dùng to Array để chuyển thành mảng)
    let vCheckboxes = $(
      "#select-method-payment input[name='payment-check-box']"
    ).toArray(); //chọn tất cả thẻ input có name='payment-check-box' trong element có id select-method-payment
    //Đặt biến lưu giá trị tìm thấy
    //Sử dụng hàm forEach thay cho for để ngắn gọn
    vCheckboxes.forEach(function (paramCheckbox) {
      if (paramCheckbox.checked) {
        //kiểm tra trạng thái checked
        //nếu checkbox đó được chọn(true)
        paramOrderObj.methodPayment = $(paramCheckbox).val();
      }
    });

    //lấy giá trị voucherID
    if (gVoucherId == "") {
      //nếu ko có voucher
      delete paramOrderObj.voucherId; //dùng toán tử delete để xóa thuộc tính của đối tượng
    } else {
      //nếu có voucher
      paramOrderObj.voucherId = gVoucherId; //gán giá trị cho thuộc tính voucherId
    }

    // Lấy giá trị trong local để gán vào mảng detail
    gProductsArray.forEach(function (paramProduct) {
      //Tạo 1 đối tượng mới chứa foodId và quantity
      let bProductDetailObj = {
        foodId: paramProduct.id,
        quantity: paramProduct.qty,
      };
      // Gán đối tượng đó vào mảng detail
      paramOrderObj.details.push(bProductDetailObj);
    });
  }

  // Hàm kiểm tra dữ liệu create order
  function validateDataCreateOrder(paramOrderObj) {
    "use strict";
    if (paramOrderObj.firstName == "") {
      alert("First Name không được để trống");
      return false;
    }
    if (paramOrderObj.lastName == "") {
      alert("Last Name không được để trống");
      return false;
    }
    if (paramOrderObj.email == "") {
      alert("Email không được để trống");
      return false;
    }
    let vEmailCheck = validateEmail(paramOrderObj.email);
    if (!vEmailCheck) {
      alert("Email không đúng định dạng");
      return false;
    }
    if (paramOrderObj.address == "") {
      alert("Địa chỉ không được để trống");
      return false;
    }
    if (paramOrderObj.phone == "") {
      alert("Số điện thoại không được để trống");
      return false;
    }
    let vNumberPhoneCheck = validateNumberPhone(paramOrderObj.phone);
    if (!vNumberPhoneCheck) {
      alert("Số điện thoại không đúng định dạng");
      return false;
    }
    if (paramOrderObj.methodPayment == "") {
      alert("Vui lòng chọn phương thức thanh toán");
      return false;
    }
    if (paramOrderObj.details.length < 1) {
      alert("Giỏ hàng của bạn đang trống");
      return false;
    }
    return true;
  }

  // Hàm xử lý call API create order
  function callAPICreateOrder(paramOrderObj) {
    "use strict";
    $.ajax({
      url: gBASE_URL + "/orders",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(paramOrderObj),
      dataType: "json",
      success: displayDataCreateOrderSuccess,
      error: function (error) {
        alert("Thanh toán đơn hàng không thành công, vui lòng thử lại");
        console.assert(error.responseText);
      },
    });
  }

  // Hàm xử lý hiển thị khi tạo đơn hàng thành công
  function displayDataCreateOrderSuccess(paramResponse) {
    "use strict";
    $("#make-payment-modal").modal("hide"); //ẩn modal thanh toán
    $("#make-payment-modal-success").modal(); //hiện modal success
    console.log(paramResponse);
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

  /*hàm kiểm tra sđt
      Nếu khớp, test() trả về true; nếu không khớp, nó trả về false.
      */
  function validateNumberPhone(paramNumberPhone) {
    "use strict";
    let vFormatReg = /^(?:\+84|0)[0-9]{8,9}$/;
    let vCheck = vFormatReg.test(paramNumberPhone);
    return vCheck;
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
});
