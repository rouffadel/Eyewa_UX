
1.Get Categories()

https://demo.api.eyewacloud.com/api/products/FillCategory

Response:
{
  "status": "200",
  "message": "Success",
  "objresult": [
    {
      "CategoryID": 1,
      "CategoryName": "Frames - P"
    },
    {
      "CategoryID": 2,
      "CategoryName": "Frames - M"
    },
	]
}


2.GetBrands By Keyword

'https://demo.api.eyewacloud.com/api/products/GetBrand?BrandName=b'

	
Response :

{
  "status": "200",
  "message": "Success",
  "objresult": [
    {
      "BrandID": 128,
      "BrandName": "Bella"
    },
    {
      "BrandID": 278,
      "BrandName": "BUTTERFLY"
    },
	]
}


3.Get Model No

https://demo.api.eyewacloud.com/api/products/GetProduct?CategoryId=6&BrandId=8&StoreId=2&ProductName=b

Response:
{
    "status": "200",
    "message": "Success",
    "objresult": {
        "table": [
            {
                "productName": "BNS1078",
                "productValue": 480.00,
                "maxDiscount": 75.00,
                "productID": 12,
                "categoryID": 6,
                "brandID": 8,
                "brandName": "Bono"
            },
            {
                "productName": "BNS1056",
                "productValue": 480.00,
                "maxDiscount": 75.00,
                "productID": 14,
                "categoryID": 6,
                "brandID": 8,
                "brandName": "Bono"
            },
            {
                "productName": "BNS1079",
                "productValue": 450.00,
                "maxDiscount": 75.00,
                "productID": 17,
                "categoryID": 6,
                "brandID": 8,
                "brandName": "Bono"
            }
        ]
    },
    "qrcodeimg": null
}



4.Get Quantity By ProductId

https://demo.api.eyewacloud.com/api/products/GetQuantity?ProductId=12

Response:
{
  "status": "200",
  "message": "Success",
  "objresult": [
    {
      "AvailableQuantity": 1
    }
  ],
  "qrcodeimg": null
}


5.Save Sales
https://demo.api.eyewacloud.com/api/sales/SaveSalesDetails


Payload:
{
    "SalesId": 116062,
    "LoginId": "1",
    "StoreId": "2",
    "SalesGrids": [
        {
            "SalesDetailId": 116062,
            "CategoryId": 6,
            "BrandId": 8,
            "ProductId": 12,
            "ProductValue": 480,
            "Quantity": "2",
            "Discount": 96,
            "SellingPrice": "864.00",
            "Tax": 0,
            "TaxPer": 0
        }
    ],
    "GrossTotal": 960,
    "Discount": 96,
    "Tax": "0",
    "NetTotal": "864.00",
    "Balance": "864.00",
    "PaidAmount": 0,
    "AdvancePaidAmount": 0,
    "PaymentMode": "Cash",
    "CustomerName": "Mobark",
    "CustomerNo": "0546388847",
    "SalesManId": 0
}

