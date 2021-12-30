const express = require('express');
const PORT = process.env.PORT||3000;
const path = require('path');
const bodyparser = require('body-parser')
const mongoose = require('mongoose');
const app = express();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const dotenv = require("dotenv")
const flash = require('connect-flash');
const session = require('express-session')
require('./config/passport')(passport);
dotenv.config()

// Databse Stuff
const dbPath = process.env.URL ;
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbPath);
}
var KooContent = require('./models/content.js');
var User = require('./models/user.js');

//****Database stuff Ends*****

const publicPath = path.join(__dirname,"public");
app.set('view engine', 'hbs');
app.use(express.static(publicPath));


//Body parser middleware
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())

//Registration and Login Stuff.....

// Express session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);
  
  // Passport middleware
app.use(passport.initialize());
app.use(passport.session());
  
  // Connect flash
app.use(flash());
  


app.get('/register',(req,res)=>{
    res.render('register');
})
app.post('/register', async(req,res)=>{

    var oldUser = await User.findOne({email:req.body.email});
    if (oldUser) {
        return res.status(409).render("register",{
            msg:"Email is already registered"
        });
    }
    var newUser = new User();
    newUser.first_name = req.body.first_name;
    newUser.last_name = req.body.last_name;
    newUser.email = req.body.email;
    newUser.password = await bcrypt.hash(req.body.password,10);
    newUser.save();
    res.redirect('/login');
})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
});

//Registration and login stuff ends here....
app.get('/',ensureAuthenticated,(req,res)=>{
    KooContent.find((err,results)=>{
        if(err) 
            return console.error(err);
        else{
            res.render('index',{
                posts:results
            });
        }
  });

});

app.get('/like/:id',ensureAuthenticated, async(req,res)=>{
    try{
        var post = await KooContent.findById(req.params.id);
        if(!post.likes.includes(req.user.email)){
            await post.updateOne({$push:{likes:req.user.email}});
            res.redirect('/');
        }else{
            await post.updateOne({$pull:{likes:req.user.email}});
            res.redirect('/');
        }
    }catch(err){
        res.status(500).json(err);
    }

});

app.post('/addcontent',ensureAuthenticated,(req,res)=>{
    const coontent = new KooContent();
    coontent.author = req.user.first_name;
    coontent.username = req.user.email;
    coontent.content = req.body.content;
    coontent.likes = [];
    coontent.save();
    res.redirect('/');
})

app.get('/people',ensureAuthenticated,(req,res)=>{
    User.find((err,results)=>{
        if(err) 
            return console.error(err);
        else{
            res.render('people',{
                posts:results
            });
        }
    });
});
app.get('/yourfeed',ensureAuthenticated,(req,res)=>{
    KooContent.find({username : req.user.email},(err,results)=>{
        if(err) 
            return console.error(err);
        else{
            res.render('yourfeed',{
                posts:results
            });
        }
  });
})

// Edit content ..................
app.get('/edit/:id',ensureAuthenticated,async(req,res)=>{
    try{
        const post = await KooContent.findById(req.params.id);
        if(req.user.email == post.username)
        {
            res.render('editpost',{
                post:post
            });
        }
        else
            res.redirect('/');
    } catch(err){
        res.status(500).json(err);
    }
});

app.post('/edit/:id',ensureAuthenticated,async(req,res)=>{
    try{
        const post = await KooContent.findById(req.params.id);
        await post.updateOne({content : req.body.content});
        res.redirect('/');
    }catch(err){
        res.status(500).json(err);
    }
});

app.listen(PORT,()=>{
    console.log(`Listening on ${PORT}`);
});


function ensureAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } 
    else {
      req.flash('danger', 'Login to access this page!');
      res.redirect('/login');
    }
}