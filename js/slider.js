$(document).ready(function () {
    //Chọn phần tử HTML có ID là "slider-range" và khởi tạo nó như một thanh trượt sử dụng tiện ích trượt của jQuery UI.
    $("#slider-range").slider({
        range: true,//Thiết lập thanh trượt là một thanh trượt khoảng, cho phép chọn một khoảng giá trị
        values: [10, 30],//Thiết lập giá trị khởi đầu của thanh trượt là một khoảng từ 10 đến 30
        min: 10,
        max: 30,
        step: 0.01,
        slide: function (event, ui) {
            //event là một đối tượng chứa thông tin về sự kiện di chuyển thanh trượt
            //ui là một đối tượng chứa thông tin liên quan đến trạng thái của thanh trượt sau sự kiện
            // /Trong trường hợp của thanh trượt với range: true, ui thường chứa một thuộc tính values là một mảng các giá trị của các "handle" trên thanh trượt.
            $("#min-price").html(ui.values[0]);//values ở đây có 2 phần tử nên ui.values[0] là lấy và gán phần tử đầu tiên(min)

            $("#max-price").html(ui.values[1]);//lấy và gán phần tử max
        }
    });
})