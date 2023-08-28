import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieparser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

mongoose
  .connect('mongodb://localhost:27017', {
    dbName: 'backenddata',
  })
  .then((c) => console.log('Database Connected'))
  .catch((e) => console.log(e));

//scehma ban gye
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema); //collection ban gya

const app = express();

//using middleware
app.use(express.static(path.join(path.resolve(), 'public'))); //serve static files from the public durectoery
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

//setting up view engine
app.set('view engine', 'ejs');

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, 'dkjdkjskjsds');
    req.user = await User.findById(decoded);

    next();
  } else {
    res.redirect('login');
  }
};
app.get('/', isAuthenticated, (req, res) => {
  res.render('logout', { name: req.user.name });
});

app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect('/register');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render('login', { email, message: 'Incorrect password' });
  }

  const token = jwt.sign({ _id: user._id }, 'dkjdkjskjsds');

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect('/');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  //console.log(req.body);
  let user = await User.findOne({ email }); // user exist karta h ya nhi
  if (user) {
    return res.redirect('/login');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, 'dkjdkjskjsds');

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.cookie('token', null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect('/');
});

// res.sendFile('index.html');

// app.get('/success', (req, res) => {
//   res.render('success');
// });

// app.post('/contact', async (req, res) => {
//   // const userdata = users.push({ name: req.body.name, email: req.body.email });
//   // res.render('success');
//   await Message.create({ name: req.body.name, email: req.body.email });
//   res.redirect('/success');
// });

// app.get('/users', (req, res) => {
//   res.json({ users }); //Inside the callback function, the code sends a JSON response back to the client using the res.json method.
// });
app.listen(5000, () => {
  console.log('Server listening on port');
});
