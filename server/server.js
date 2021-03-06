require('./config/config.js');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

var {mongoose} = require('./db/mongoose.js');
var {Todo} = require('./models/todo.js');
var {User} = require('./models/user.js');
var {authenticate} = require('./middleware/authenticate.js');

var app = express();
//const port = process.env.PORT || 3000;
const port = process.env.PORT;

app.use(bodyParser.json());



//Resources creation
app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((todoDoc) => {
    res.send(todoDoc);
  }, (e) => {
    res.status(400).send(e);
  });
  //console.log(req.body);
});



app.get('/todos', authenticate, (req, res) => {
  //find() can receive empty arguments
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  },(e) => {
    res.status(400).send(e);
  });
});



// GET /todos/1235431
app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  //res.send(req.params);
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }

  //Todo.findById(id).then((todo) => {
  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo){
      return res.status(404).send();
    }

    res.send({todo: todo});
    },(e) => {
    res.status(400).send();
  });
});



app.delete('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if(!ObjectID.isValid(id)){
    return res.status(404).send({error: 'id not valid'});
  }

  Todo.findOneAndDelete({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo){
      return res.status(404).send({error: 'todo not found'});
    }

    res.send({todo});

    },(e) => {
      res.status(400).send({error: 'error in method findOneAndDelete'});
  });
});



app.patch('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  //1)
  var body = _.pick(req.body, ['text','completed']);

  if(!ObjectID.isValid(id)){
    return res.status(404).send({error: 'id not valid'});
  }

  //2)
  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  //3)
  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, {$set: body},{new: true}).then((todo) => {
    if(!todo){
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});



// POST /users
// Signup route
app.post('/users',(req, res) => {

  var body = _.pick(req.body, ['email','password']);
  var user = new User(body);

  // User.findByToken
  // user.generateAuthToken

  user.save().then(() => {
    return user.generateAuthToken();
    //res.send(user);
  }).then((token) => {
    //res.header() lets us set a header so it takes the key value
    res.header('x-auth', token).send(user);
  }).catch ((e) => {
    res.status(400).send(e);
  });

});



app.get('/users', (req, res) => {
  //find() can receive empty arguments
  User.find().then((users) => {
    res.send({users});
  },(e) => {
    res.status(400).send(e);
  });
});



app.get('/users/me',authenticate, (req, res) => {
  res.send(req.user);
});



app.post('/users/login', (req, res) => {

  var body = _.pick(req.body, ['email','password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
    //res.send(user);
  }).catch((e) => {
    res.status(400).send();
  });

  // User.findOne({email: body.email}).then((user) => {
  //   if(!user){
  //     return res.status(404).send({error: 'user not found'});
  //   }
  //
    // bcrypt.compare(body.password, user.password, (err, response) => {
    //   //console.log(req.body.password);
    //   //console.log(user.password);
    //
    //   if(!err){
    //     //console.log('passing');
    //     //console.log(response);
    //     if(response){
    //       return res.send(body);
    //     } else{
    //       return res.send({error: 'passwords do not match'})
    //     }
    //   }
    //   res.send({error: 'error in bcrypt'});
    // });
  // }).catch((e) => {
  //   res.status(400).send({error: 'error in method findOne'});
  //   console.log(e);
  // });
});



app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  },() => {
    res.status(400).send();
  })
});



app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};
