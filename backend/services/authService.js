const { User } = require('../models');

exports.createUserAccount = async (data) => {
  const existingUser = await User.findOne({ $or: [{ email: data.email }, { phone: data.phone }] });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = new User(data);
  await user.save();
  return user;
};
