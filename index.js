const express = require('express')
const paypal = require('paypal-rest-sdk')
const cors = require('cors')
const axios = require('axios');

const app = express()

app.use(cors());

paypal.configure({
    'mode': 'sandbox', 
    'client_id': 'AW7PuFbhrRmzEoR1qH7oLCR3Ae6YvX8LMlNnwYYLfyO8UswUy1k0wLuC12BsjLUPzsM0khHwx21RvSxi',
    'client_secret': 'EHLmDQ-NMhoo6WHNK9ZNFw8BMPuLz94CPX-eAmUCz1sDPZ6u7D8ugnbgR5VCEcfeIzWDWd57D7KYNJeV'

})
const verifyCaptcha = async (captchaValue) => {
    const secretKey = '6LfyDEsqAAAAALZOxgB0BDtV7nVU7zz0A7POZQUE';
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaValue}`;
    const response = await axios.post(url);
    return response.data.success;
};

app.get('/', (req, res)=>{
    res.send('Hello World')
})
    
app.post('/payment', async(req,res)=>{

    const { captcha } = req.body; // Get captcha value from request

    // Verify captcha
    const isCaptchaValid = await verifyCaptcha(captcha);
    if (!isCaptchaValid) {
        return res.status(400).json({ error: 'Invalid captcha' });
    }
    
    try {
        let create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "https://payment-server-two.vercel.app/success",
                "cancel_url": "https://payment-server-two.vercel.app/failed"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "item",
                        "sku": "item",
                        "price": "1.00",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": "1.00"
                },
                "description": "This is the payment description."
            }]
        };

        await paypal.payment.create(create_payment_json, function(error, payment) {
            if (error){
                console.log('error')
            }else{
                console.log("Create Payment Response");
                // console.log(payment);
                data = payment;
                res.json(data);
            }

        })
    }catch (error){
        console.log(error)
    }
})

app.get('/success', async (req, res) => {

    try {

        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;

        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "USD",
                    "total": "1.00"
                }
            }]
        }


        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                console.log(error)
                return res.redirect("https://payment-server-4do1.vercel.app/failed");
            } else {
                console.log("Execute Payment Response");
                // console.log(payment);
                const response = JSON.stringify(payment);
                const parsedResponse = JSON.parse(response);

                const transactions = parsedResponse.transactions[0];

                console.log("transactions", transactions);

                return res.redirect("https://payment-server-4do1.vercel.app/success");
            }
        })


    } catch (error) {
        console.log(error);
    }

})


app.get('/failed', async (req, res) => {
    return res.redirect("https://payment-server-4do1.vercel.app/failed");
})


app.listen(8000, () => {
    console.log('Server is running on port 8000')
})
