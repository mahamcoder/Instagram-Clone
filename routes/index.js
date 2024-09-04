var express = require('express');
var router = express.Router();
const usermodel = require("./users");
const postmodel=require("./post");
const passport = require("passport");
const localstrategy = require("passport-local");
const upload = require('./multer');
passport.use(new localstrategy(usermodel.authenticate()));



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});
router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash('error') });
})
router.get('/home', isLoggedIn,async function (req, res, next) {
  const user = await usermodel.findOne({ username: req.session.passport.user });
  const posts=await postmodel.find().populate("user");
  res.render('home',{user,posts})
})
router.get("/like/post/:id",isLoggedIn,async function(req,res){
  const user=await usermodel.findOne({username:req.session.passport.user});
  const post=await postmodel.findOne({_id:req.params.id});
  // if already like remove like
  // if not like, like it
  if(post.likes.indexOf(user._id) === -1){
    post.likes.push(user._id)
  }
  else{
   post.likes.splice(post.likes.indexOf(user._id),1);
  }
  await post.save();
  res.redirect("/home");
})
router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await usermodel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render('profile', { user })
})
router.get('/edit', isLoggedIn,async function (req, res, next) {
  const user = await usermodel.findOne({ username: req.session.passport.user })
  res.render('edit', { user });
})
router.get('/upload',isLoggedIn,function(req,res,next){
  res.render( 'upload' );
})
router.get('/search',isLoggedIn,function(req,res,next){
  res.render('search')
})

router.get('/username/:username',async function(req,res,next){
  const regix=new RegExp(`^${req.params.username}`,'i')
 const users=await usermodel.find({username:regix});
 res.json(users);
})
// posts routes
router.post('/register', function (req, res, next) {
  const userdata = new usermodel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });
  usermodel.register(userdata, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/home');
      })
    })
})
// login route
router.post('/login',
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
  })
  , function (req, res, next) {
  })
// logout route
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});
// form submit multer
router.post("/edit", upload.single('image'), async function (req, res, next) {
  const user = await usermodel.findOneAndUpdate(
    {
      username: req.session.passport.user
    },
    {
      username: req.body.username,
      name: req.body.name,
      bio: req.body.bio,
    }, { new: true });
    if(req.file){
      user.profileimage = req.file.filename;
    }
  
  await user.save();
  res.redirect('/profile');
})
// post images
router.post('/upload',isLoggedIn,upload.single("image"),async function(req,res,next){
const user=await usermodel.findOne({username:req.session.passport.user});
const post=await postmodel.create({
  picture:req.file.filename,
  user:user._id,
  caption:req.body.caption
})
user.posts.push(post._id);
await user.save();
res.redirect('/home');
})
// make loggedin route
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = router;
