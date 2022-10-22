const express = require('express');
const app = express();
const mongoose = require('mongoose'); // adds MongoDB to the Project
const dotenv = require("dotenv");
const express_session = require("express-session");
const flash = require("connect-flash");
const expressLayouts = require('express-ejs-layouts');
const Cart = require("./models/cart");
const User = require("./models/User");
const passport = require("passport");

// COOKIES:
const cookieparser = require('cookie-parser');
app.use(cookieparser());


//Layouts:
app.use(expressLayouts);
app.set('layout', "./layouts/full-width");


//middleware:
const authmw = require('./middleware/authMiddleWare');
const bp = require('body-parser');
const morgan = require("morgan");
app.use(morgan('tiny'));

//Routers:
const cartRouter = require('./routes/cart');
const authRouter = require("./routes/auth");
const ProductRouter = require("./routes/products");
const userRouters = require("./routes/users");
const orderRouters = require("./routes/orders");
const categoryRouters = require("./routes/categories");
const brandRouters = require("./routes/brands");
const ProductModel = require("./models/Product");
const { $where } = require('./models/User');

// DOTENV:
dotenv.config();

// EXPRESS:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

// Mongo DB Connection:
mongoose.connect(process.env.MONGO_URL).then(() => console.log("DB Connection Successfully!"))
    .catch((err) => {
        console.log(err);
    });

// session + flash:
app.use(express_session({
    secret: process.env.SESSION_SEC,
    cookie: { maxAge: 6000 },
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

// Passport:
app.use(passport.initialize());
app.use(passport.session());

// EJS:
app.use(express.static("public"));
app.use('/css', express.static(__dirname + "public"));
app.set("view engine", "ejs");
app.set('views', __dirname + '/views');



// GET for login,signup and logout:
app.get('/login', (req, res) => {
            const error = req.flash('error');
            res.render('./pages/login.ejs', { error, title: "Login", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/style-login.css", isAdmin: req.cookies.isAdmin,username: req.cookies.username});
});

app.get('/register', (req, res) => {
    const error = req.flash('error');
    res.render('./pages/register.ejs', { error, title: "Register", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/register.css",isAdmin: req.cookies.isAdmin,username: req.cookies.username});
});

// GET THE PRODUCTS AT THE HOMEPAGE
app.get('/homepage', (req, res) => {
    updatedItems = [];
    ProductModel.find({}, async function (err, items) {
        if (err) { console.log(err); }
        if (req.query.search) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].category.name == req.query.search) {
                    updatedItems.push(items[i]);
                }
            }
            res.render('./pages/homePage.ejs', { title: "Home-Page", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/homepage.css",username: req.cookies.username,isAdmin:req.cookies.isAdmin, user: req.cookies.user, ProductModel: updatedItems });
        } else {

            ProductModel.find({}, async function (err, products) {
                if (err) { console.log(err); }
                Cart.findOne({ user: req.cookies.user }, async function (err, cart) {
                    if (err) { console.log(err); }
                    res.render('./pages/homePage.ejs', { title: "Home-Page", ProductModel: products, headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/homepage.css", isAdmin:req.cookies.isAdmin,username: req.cookies.username,user: req.cookies.user, Cart: cart });
                }).populate({
                    path: 'cartItems.product',
                    populate: ([
                        { path: 'category' },
                        { path: 'brand' }
                    ]) // Multiple populate populate([{},{}]) --> this is the syntax .
                });
            });
        }
    }).populate('category').populate('brand');
}); // Ori


// LOGOUT:
app.get('/logout', authRouter);

// GET SHOP:
app.get('/shop', (req, res) => {
    updatedItems = [];
    ProductModel.find({}, async function (err, items) {
        if (err) { console.log(err); }
        if (req.query.search) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].category.name == req.query.search) {
                    updatedItems.push(items[i]);
                }
            }
            Cart.findOne({ user: req.cookies.user }, async function (err, cart) {
                if (err) { console.log(err); }
                res.render('./pages/shop.ejs', { title: "Shop", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/shop.css",username: req.cookies.username,isAdmin:req.cookies.isAdmin, user: req.cookies.user, ProductModel: updatedItems , Cart : cart });
            }).populate({
                path: 'cartItems.product',
                populate: ([
                    { path: 'category' },
                    { path: 'brand' }
                ]) // Multiple populate populate([{},{}]) --> this is the syntax .
            });
                
        } else {

            ProductModel.find({}, async function (err, products) {
                if (err) { console.log(err); }
                Cart.findOne({ user: req.cookies.user }, async function (err, cart) {
                    if (err) { console.log(err); }
                    res.render('./pages/shop.ejs', { title: "Shop", ProductModel: products, headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/shop.css", isAdmin:req.cookies.isAdmin,username: req.cookies.username,user: req.cookies.user, Cart: cart });

                }).populate({
                    path: 'cartItems.product',
                    populate: ([
                        { path: 'category' },
                        { path: 'brand' }
                    ]) // Multiple populate populate([{},{}]) --> this is the syntax .
                });
            });
        }
    }).populate('category').populate('brand');

});

// GET ABOUT:
app.get('/about', (req, res) => {
    Cart.findOne({ user: req.cookies.user }, async function (err, cart) {
        if (err) { console.log(err); }
        res.render('./pages/About.ejs', { title: "About", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/about.css", isAdmin:req.cookies.isAdmin,username: req.cookies.username,user: req.cookies.user , Cart: cart });
    }); 
});

//Product-page:
app.get('/product-page', (req, res) => {
    ProductModel.find({}, async function (err, products) {
        if (err) {
            console.log(err);
        }
        Cart.findOne({ user: req.cookies.user }, async function (err, cart) {
            if (err) { console.log(err); }
            res.render('./pages/product-page.ejs', { title: "Product-Page", headercss: "/css/header.css", footercss: "/css/footer.css", ProductModel: products, cssfile: "/css/product-page.css",isAdmin:req.cookies.isAdmin, username: req.cookies.username,user: req.cookies.user , Cart: cart });
        }); 
    }).populate('category');
});

// Admin page:
app.get('/admin', authmw.authAdmin, (req, res) => {
    User.find({}, async function (err, users) {
        if (err) {
            console.log(err);
        } else {
            Cart.findOne({user: req.user.id}, async function (err, cart) {
                if (err) {
                    console.log(err);
                }
                res.render('./pages/admin.ejs', { title: "Admin page", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/full-width.css", users: users,isAdmin:req.cookies.isAdmin,username: req.cookies.username, user: req.cookies.user, Cart : cart});
            });     
        }
    });
});

// Create-Product page:
app.get('/create-product', authmw.authAdmin, (req, res) => {
    Cart.findOne({user: req.user.id}, async function (err, cart) {
        if (err) {
            console.log(err);
        }
        res.render('./pages/CreateProduct.ejs', { title: "Create Product", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/full-width.css",isAdmin:req.cookies.isAdmin,username: req.cookies.username, user: req.cookies.user , Cart : cart});
    });
        
});

// Checkout page:
app.get('/checkout', (req, res) => {
    Cart.findOne({ user: req.cookies.user }, function (err, cart) {
        if (err) { console.log(err); }
        if (cart) {
            res.render('./pages/checkout.ejs', { title: "Checkout", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/checkout.css",isAdmin:req.cookies.isAdmin, username: req.cookies.username,user: req.cookies.user, cart: cart, total: req.query.total, Cart: cart });
        }
    }).populate({
        path: 'cartItems.product',
        populate: ([
            { path: 'category' },
            { path: 'brand' }
        ]) // Multiple populate populate([{},{}]) --> this is the syntax .
    });
});


// Cart page:
app.get('/cart', (req, res) => {
    Cart.findOne({ user: req.cookies.user }, (err, cart) => {
        if (err) {
            console.log(err);
        }
        res.render('./pages/cart.ejs', { title: "Cart", headercss: "/css/header.css", footercss: "/css/footer.css", cssfile: "/css/cart.css",isAdmin:req.cookies.isAdmin,username: req.cookies.username, user: req.cookies.user, cartItems: cart.cartItems , Cart : cart });
    }
    ).populate({ path: 'cartItems.product', populate: { path: 'brand' } });
});



// POST for login and signup:
app.post('/register', authRouter);
app.post('/login', authRouter);

// Main Route:
app.get('/', (req, res) => res.render('index'));

// ROUTES:
app.use("/api/", ProductRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouters);
app.use("/api/", categoryRouters);
app.use("/api/", brandRouters);
app.use("/api/orders", orderRouters);
app.use("/", cartRouter);



// Server Connection:
app.listen(3000, () => console.log(`Example app listening on port 3000!`));


