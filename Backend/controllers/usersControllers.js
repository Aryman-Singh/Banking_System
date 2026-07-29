const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { generateUsersToken } = require("../helpers/generateUsersToken");
 

//@desc   >>>> Get All Users
//@route  >>>> GET /api/users
//@Access >>>> private(admins)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "_id user_name email user_status no_of_account"
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Get one User
//@route  >>>> GET /api/users/:id
//@Access >>>> private(User)
const getOneUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send("User Not Found!");
    }

    res.status(200).json({
      name: user.user_name,
      email: user.email,
      address: user.full_addresse,
      id: user.id,
      accountsCount: user.no_of_account,
      createdAt: user.createdAt,
      userStatus: user.user_status,
      postal: user.zip_code,
      phone: user.phone,
      accounts: user.accounts,
      notifications: user.notifications,
    });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Create one User
//@route  >>>> POST /api/users
//@Access >>>> Public
const createUser = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      user_name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone,
      full_addresse: req.body.addresse,
      zip_code: req.body.postal,
    });

    res.status(201).json({
      id: user.id,
      name: user.user_name,
      email: user.email,
      token: generateUsersToken(user.id, user.email),
    });
  } catch (error) {
    if (
      error.message.match(
        /(email|password|name|postal|phone|address|addresse)/gi
      )
    ) {
      return res.status(400).send(error.message);
    }

    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> User Login
//@route  >>>> POST /api/users/login
//@Access >>>> Public
const userLogin = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send("Please provide email and password");
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .send("Wrong Credentials - wrong email or password");
    }

    const isCorrectPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!isCorrectPassword) {
      return res
        .status(401)
        .send("Wrong Credentials - wrong email or password");
    }

    return res.status(200).json({
      id: user.id,
      name: user.user_name,
      email: user.email,
      token: generateUsersToken(user.id, user.email),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> UPDATE User info
//@route  >>>> PUT /api/users/:id
//@Access >>>> private(for User only)
const updateUser = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send("User Not Found!");
    }

    user.email = req.body.email;
    user.password = hashedPassword;
    user.phone = req.body.phone;
    user.full_addresse = req.body.addresse;
    user.zip_code = req.body.postal;

    const updatedUser = await user.save();

    res.status(200).json({
      name: updatedUser.user_name,
      email: updatedUser.email,
      address: updatedUser.full_addresse,
      id: updatedUser.id,
      accountsCount: updatedUser.no_of_account,
      createdAt: updatedUser.createdAt,
      userStatus: updatedUser.user_status,
      postal: updatedUser.zip_code,
      phone: updatedUser.phone,
      accounts: updatedUser.accounts,
      notifications: updatedUser.notifications,
    });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Notification isSeen update
//@route  >>>> PUT /api/users/notifications/:id
//@Access >>>> private(for User only)
const notificationUpdate = async (req, res) => {
  try {
    const user = req.user;

    user.notifications = user.notifications.map((notification) => {
      if (notification.id === req.params.id) {
        return { ...notification, isSeen: true };
      }
      return notification;
    });

    const updatedUser = await user.save();

    res.status(200).json({
      name: updatedUser.user_name,
      email: updatedUser.email,
      address: updatedUser.full_addresse,
      id: updatedUser.id,
      accountsCount: updatedUser.no_of_account,
      createdAt: updatedUser.createdAt,
      userStatus: updatedUser.user_status,
      postal: updatedUser.zip_code,
      phone: updatedUser.phone,
      accounts: updatedUser.accounts,
      notifications: updatedUser.notifications,
    });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Delete one User
//@route  >>>> DELETE /api/users/:id
//@Access >>>> private(for admins only)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).send("User Not Found!");
    }

    res.status(200).json({ id: deletedUser.id });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Update User's Status
//@route  >>>> PUT /api/users/:id/updatestatus
//@Access >>>> private(for admins only)
const updateUserStatus = async (req, res) => {
  if (req.body.newStatus === req.body.oldStatus) {
    return res.status(400).send("Please Specify New Status For That User");
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send("User Not Found!");
    }

    user.user_status = req.body.newStatus;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser.id,
      user_name: updatedUser.user_name,
      email: updatedUser.email,
      no_of_account: updatedUser.no_of_account,
      user_status: updatedUser.user_status,
    });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

module.exports = {
  getUsers,
  getOneUser,
  createUser,
  userLogin,
  updateUser,
  deleteUser,
  updateUserStatus,
  notificationUpdate,
};