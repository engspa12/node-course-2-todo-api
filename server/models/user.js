var mongoose = require('mongoose');

//Creating a model
var User = mongoose.model('User',{
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  }
});

module.exports = {
  User
};
