var express = require('express');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
var port_number = 4030;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let access_token = '';
let refresh_token = '';
let session = '';
let db_list = [];
let Authorization_header = 'ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3';
let redirect_uri = 'http://147.139.168.202:8888/';

app.post('/get-accurate-access-token-and-refresh-token', async function (req, res, next) {
    let code = req.query.code;
    var options = {
        'method': 'POST',
        'url': `https://account.accurate.id/oauth/token?code=${code}&grant_type=authorization_code&redirect_uri=${redirect_uri}`,
        'headers': {
            'Authorization': `Basic ${Authorization_header}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                if(response_body.access_token != undefined && response_body.refresh_token != undefined){
                    access_token = response_body.access_token;
                    refresh_token = response_body.refresh_token;
                    res.send(response_body);
                }
            }
        }
    });
})

app.post('/refresh-accurate-token', async function (req, res, next) {
    let refresh_token_from_user = req.query.refresh_token;
    var options = {};
    if(refresh_token != undefined){
        options = {
            'method': 'POST',
            'url': `https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=${refresh_token}`,
            'headers': {
                'Authorization': `Basic ${Authorization_header}`
            }
        };
    }else{
        options = {
            'method': 'POST',
            'url': `https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=${refresh_token_from_user}`,
            'headers': {
                'Authorization': `Basic ${Authorization_header}`
            }
        };
    }
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                if(response_body.access_token != undefined && response_body.refresh_token != undefined){
                    access_token = response_body.access_token;
                    refresh_token = response_body.refresh_token;
                    res.send(response_body);
                }
            }
        }
    });
      
})

app.post('/get-accurate-db-list', async function (req, res, next) {
    var options = {
        'method': 'GET',
        'url': 'https://account.accurate.id/api/db-list.do',
        'headers': {
          'Authorization': `Bearer ${access_token}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                if(response.body.d != undefined){
                    db_list = response.body.d;
                }
                res.send(response_body);
            }
        }
    });
      
})

app.post('/get-db-access', async function (req, res, next) {
    let db_id = req.query.db_id;
    var options = {
        'method': 'GET',
        'url': `https://account.accurate.id/api/open-db.do?id=${db_id}`,
        'headers': {
          'Authorization': `Bearer ${access_token}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                if(response_body.session != undefined){
                    session = response_body.session;
                }
                res.send(response_body);
            }
        }
    });
})

/*
    customers
*/

app.post('/get-all-customers', async function (req, res, next) {
    let page = req.query.page;
    console.log(session);
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/customer/list.do?sp.page=${page}&fields=id, customerNo`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                res.send(response_body);
            }
        }
    });
})

app.post('/get-all-customers-with-details', async function (req, res, next) {
    let page = req.query.page;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/customer/list.do?sp.page=${page}&fields=id, customerNo`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                let customer_data = [];
                if(response_body.d != undefined){
                    let i = 0;
                    for(i; i < response_body.d.length; i++){
                        customer_data.push(await get_customer_details(response_body.d[i].id));
                    }
                }
                res.send(customer_data);
            }
        }
    });
})

async function get_customer_details(customer_id){
    return new Promise(async (resolve, reject) => {
        var options = {
                'method': 'GET',
                'url': `https://public.accurate.id/accurate/api/customer/detail.do?id=${customer_id}`,
                'headers': {
                'Authorization': `Bearer ${access_token}`,
                'X-Session-ID': `${session}`
            }
        }; 
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(get_customer_details(customer_id));
            }else{
                resolve(JSON.parse(response.body).d);
            }
        });
    });
}

app.post('/add-new-customer', async function (req, res, next) {
    let customer_data = req.body.customer_data;
    var options = {
        'method': 'POST',
        'url': `https://public.accurate.id/accurate/api/customer/save.do?name=${customer_data.name}&billStreet=${customer_data.billStreet}&billCity=${customer_data.billCity}&billProvince=${customer_data.billProvince}&billCountry=${customer_data.billCountry}&billZipCode=${customer_data.billZipCode}&currencyCode=IDR&email=${customer_data.email}&mobilePhone=${customer_data.mobilePhone}&workPhone=${customer_data.workPhone}&npwpNo=${customer_data.npwpNo}&shipStreet=${customer_data.shipStreet}&shipCity=${customer_data.shipCity}&shipProvince=${customer_data.shipProvince}&shipCountry=${customer_data.shipCountry}&shipZipCode=${customer_data.shipZipCode}&detailShipAddress[0].street=${customer_data.detailShipAddress[0].street}&detailShipAddress[0].city=${customer_data.detailShipAddress[0].city}&detailShipAddress[0].province=${customer_data.detailShipAddress[0].province}&detailShipAddress[0].country=${customer_data.detailShipAddress[0].country}&detailShipAddress[0].zipCode=${customer_data.detailShipAddress[0].zipCode}&customerNo=${customer_data.customerNo}&consignmentStore=false&description=${customer_data.description}&wpName=${customer_data.name}`,
        'headers': {
            'X-Session-ID': `${session}`,
            'Authorization': `Bearer ${access_token}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                res.send(JSON.parse(response.body));
            }
        }
    });
})

app.post('/get-customer-details', async function (req, res, next) {
    let customer_no = req.query.customer_no;
    let page = 1;
    let total_page = 0;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/customer/list.do?sp.page=${page}&fields=id, customerNo`,
        'headers': {
        'Authorization': `Bearer ${access_token}`,
        'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            total_page = JSON.parse(response.body).sp.pageCount;
            let i = total_page; //1;
            let not_found = true;
            for(i ; i >= 1; i --){
                let search_result = await loop_through_customers(i, customer_no);
                if(search_result != false){
                    res.send(search_result);
                    i = 1;
                    not_found = false;
                }
            }
            if(i === 1 && not_found){
                res.send({
                    customer_no: customer_no,
                    status: 'Not Found'
                });
            }
        }
    });
})

async function loop_through_customers(page, customer_no){
    return new Promise(async (resolve, reject) => {
        var options = {
            'method': 'GET',
            'url': `https://public.accurate.id/accurate/api/customer/list.do?sp.page=${page}&fields=id, customerNo`,
            'headers': {
            'Authorization': `Bearer ${access_token}`,
            'X-Session-ID': `${session}`
            }
        };
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
            }else{
                if(response.body != undefined){
                    let response_body = JSON.parse(response.body);
                    if(response_body.d != undefined){
                        let i = 0;
                        for(i; i < response_body.d.length; i++){
                            let customer_information = (await get_customer_details(response_body.d[i].id));
                            console.log(customer_information.customerNo);
                            if(customer_no === customer_information.customerNo){
                                resolve(customer_information);
                                i = response_body.d.length;
                            }
                        }
                        resolve(false);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

app.post('/edit-customer', async function (req, res, next) {
    let customer_no = req.query.customer_no;
    let customer_data = req.body.customer_data;
    var options = {
        'method': 'POST',
        'url': `http://localhost:${port_number}/get-customer-details?customer_no=${customer_no}`,
        'headers': {
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                if(JSON.parse(response.body) != undefined){
                    // res.send(JSON.parse(response.body));
                    let response_body = JSON.parse(response.body);
                    let customer_data_new = {
                        "id": response_body.id,
                        "name": customer_data.name,
                        "billStreet": customer_data.billStreet,
                        "billCity": customer_data.billCity,
                        "billProvince": customer_data.billProvince,
                        "billCountry": customer_data.billCountry,
                        "billZipCode": customer_data.billZipCode,
                        "email": customer_data.email,
                        "mobilePhone": customer_data.mobilePhone,
                        "workPhone": customer_data.workPhone,
                        "npwpNo": customer_data.npwpNo,
                        "shipStreet": customer_data.shipStreet,
                        "shipCity": customer_data.shipCity,
                        "shipProvince": customer_data.shipProvince,
                        "shipCountry": customer_data.shipCountry,
                        "shipZipCode": customer_data.shipZipCode,
                        "detailShipAddress": [
                            {
                                "street": customer_data.street,
                                "city": customer_data.city,
                                "province": customer_data.province,
                                "country": customer_data.country,
                                "zipCode": customer_data.zipCode
                            }
                        ],
                        "customerNo": customer_data.customerNo,
                        "description": customer_data.description
                    }
                    customer_data = customer_data_new;
                    res.send(await add_customer_data(customer_data));
                }
            }
        }
    });
})

async function add_customer_data(customer_data){
    return new Promise(async (resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': `https://public.accurate.id/accurate/api/customer/save.do?id=${customer_data.id}&name=${customer_data.name}&billStreet=${customer_data.billStreet}&billCity=${customer_data.billCity}&billProvince=${customer_data.billProvince}&billCountry=${customer_data.billCountry}&billZipCode=${customer_data.billZipCode}&currencyCode=IDR&email=${customer_data.email}&mobilePhone=${customer_data.mobilePhone}&workPhone=${customer_data.workPhone}&npwpNo=${customer_data.npwpNo}&shipStreet=${customer_data.shipStreet}&shipCity=${customer_data.shipCity}&shipProvince=${customer_data.shipProvince}&shipCountry=${customer_data.shipCountry}&shipZipCode=${customer_data.shipZipCode}&detailShipAddress[0].street=${customer_data.detailShipAddress[0].street}&detailShipAddress[0].city=${customer_data.detailShipAddress[0].city}&detailShipAddress[0].province=${customer_data.detailShipAddress[0].province}&detailShipAddress[0].country=${customer_data.detailShipAddress[0].country}&detailShipAddress[0].zipCode=${customer_data.detailShipAddress[0].zipCode}&customerNo=${customer_data.customerNo}&consignmentStore=false&description=${customer_data.description}&wpName=${customer_data.name}`,
            'headers': {
                'X-Session-ID': `${session}`,
                'Authorization': `Bearer ${access_token}`
            }
        };
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(add_customer_data(customer_data));
            }else{
                if(response.body != undefined){
                    resolve(JSON.parse(response.body));
                }
            }
        });
    });
}

/*
    Suppliers
*/

app.post('/get-all-vendors', async function (req, res, next) {
    let page = req.query.page;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/vendor/list.do?sp.page=${page}`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                res.send(response_body);
            }
        }
    });
})

app.post('/get-all-vendors-with-details', async function (req, res, next) {
    let page = req.query.page;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/vendor/list.do?sp.page=${page}`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                let vendor_data = [];
                if(response_body.d != undefined){
                    let i = 0;
                    for(i; i < response_body.d.length; i++){
                        vendor_data.push(await get_vendor_details(response_body.d[i].id));
                    }
                }
                res.send(vendor_data);
            }
        }
    });
})

async function get_vendor_details(vendor_id){
    return new Promise(async (resolve, reject) => {
        var options = {
                'method': 'GET',
                'url': `https://public.accurate.id/accurate/api/vendor/detail.do?id=${vendor_id}`,
                'headers': {
                'Authorization': `Bearer ${access_token}`,
                'X-Session-ID': `${session}`
            }
        }; 
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
            }else{
                resolve(JSON.parse(response.body).d);
            }
        });
    });
}

/*
    Sales Orders
*/

app.post('/get-all-sales-orders', async function (req, res, next) {
    let page = req.query.page;
    console.log(session);
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=${page}`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                res.send(response_body);
            }
        }
    });
})

app.post('/get-all-sales-orders-with-details', async function (req, res, next) {
    let page = req.query.page;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=${page}`,
        'headers': {
          'Authorization': `Bearer ${access_token}`,
          'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            if(response.body != undefined){
                let response_body = JSON.parse(response.body);
                let sales_order_data = [];
                if(response_body.d != undefined){
                    let i = 0;
                    for(i; i < response_body.d.length; i++){
                        sales_order_data.push(await get_sales_order_details(response_body.d[i].id));
                    }
                }
                res.send(sales_order_data);
            }
        }
    });
})

async function get_sales_order_details(sales_order_id){
    return new Promise(async (resolve, reject) => {
        var options = {
                'method': 'GET',
                'url': `https://public.accurate.id/accurate/api/sales-order/detail.do?id=${sales_order_id}`,
                'headers': {
                'Authorization': `Bearer ${access_token}`,
                'X-Session-ID': `${session}`
            }
        }; 
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(get_sales_order_details(sales_order_id));
            }else{
                resolve(JSON.parse(response.body).d);
            }
        });
    });
}

app.post('/add-new-sales-order', async function (req, res, next) {
    let sales_order_data = req.body.sales_order_data;
    var options = {
        'method': 'POST',
        'url': `https://public.accurate.id/accurate/api/sales-order/save.do?number=${sales_order_data.number}&poNumber=${sales_order_data.poNumber}&customerNo=${sales_order_data.customerNo}&transDate=${sales_order_data.transDate}&toAddress=${sales_order_data.toAddress}&paymentTermName=${sales_order_data.paymentTermName}&description=${sales_order_data.description}&inclusiveTax=${sales_order_data.inclusiveTax}`,
        'headers': {
            'X-Session-ID': `${session}`,
            'Authorization': `Bearer ${access_token}`
        }
    };
    let i = 0;
    for(i ; i < sales_order_data.detailItem.length; i ++){
        options.url = options.url + `&detailItem[${i}].itemNo=${sales_order_data.detailItem[i].itemNo}` 
        + `&detailItem[${i}].unitPrice=${sales_order_data.detailItem[i].unitPrice}`
        + `&detailItem[${i}].quantity=${sales_order_data.detailItem[i].quantity}`;
    }
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            let response_body = JSON.parse(response.body);
            res.send(response_body);
        }
    });
})

app.post('/get-sales-order-details', async function (req, res, next) {
    let sales_order_number = req.query.sales_order_number;
    let page = 1;
    let total_page = 0;
    var options = {
        'method': 'GET',
        'url': `https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=${page}`,
        'headers': {
        'Authorization': `Bearer ${access_token}`,
        'X-Session-ID': `${session}`
        }
    };
    await request(options, async function (error, response) {
        if (error) {
            console.log(error);
        }else{
            total_page = JSON.parse(response.body).sp.pageCount;
            let i = 1;
            for(i ; i <= total_page; i ++){
                let search_result = await loop_through_sales_orders(i, sales_order_number);
                if(search_result != false){
                    res.send(search_result);
                    i = total_page;
                }
            }
            res.send({
                customer_no: customer_no,
                status: 'Not Found'
            });
        }
    });
})

async function loop_through_sales_orders(page, sales_order_number){
    return new Promise(async (resolve, reject) => {
        var options = {
            'method': 'GET',
            'url': `https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=${page}`,
            'headers': {
            'Authorization': `Bearer ${access_token}`,
            'X-Session-ID': `${session}`
            }
        };
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
            }else{
                if(response.body != undefined){
                    let response_body = JSON.parse(response.body);
                    if(response_body.d != undefined){
                        let i = 0;
                        for(i; i < response_body.d.length; i++){
                            let sales_order_information = (await get_sales_order_details(response_body.d[i].id));
                            console.log(sales_order_information.number);
                            if(sales_order_number === sales_order_information.number){
                                resolve(sales_order_information);
                                i = response_body.d.length;
                            }
                        }
                        resolve(false);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_sales_order_details(sales_order_id){
    return new Promise(async (resolve, reject) => {
        var options = {
                'method': 'GET',
                'url': `https://public.accurate.id/accurate/api/sales-order/detail.do?id=${sales_order_id}`,
                'headers': {
                'Authorization': `Bearer ${access_token}`,
                'X-Session-ID': `${session}`
            }
        }; 
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(await get_sales_order_details(sales_order_id));
            }else{
                resolve(JSON.parse(response.body).d);
            }
        });
    });
}

app.listen(port_number, function () {
    console.log('CORS-enabled web server listening on port ' + port_number)
})