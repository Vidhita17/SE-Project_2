// Load environment variables from the root .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('Environment check:');
console.log('MONGO_URI exists:', process.env.MONGO_URI ? 'Yes' : 'No');

// Direct MongoDB connection without using the existing config
const connectDB = async () => {
  try {
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      // Fallback to a direct connection string if env variable is not available
      // You need to replace this with your actual MongoDB connection string
      console.log('MONGO_URI not found in environment variables.');
      console.log('Please specify your MongoDB connection string directly:');
      
      // For local MongoDB
      const mongoUri = 'mongodb://localhost:27017/university_portal';
      console.log(`Using fallback connection: ${mongoUri}`);
      
      await mongoose.connect(mongoUri);
    } else {
      await mongoose.connect(process.env.MONGO_URI);
    }
    
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// User model schema - simplified version matching your existing model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    // Modified email validation to allow non-university emails for admins
    validate: {
      validator: function(v) {
        // Skip validation for admin role
        if (this.role === 'admin') return true;
        return /^.+@mahindrauniversity\.edu\.in$/.test(v);
      },
      message: props => `${props.value} is not a valid email! Admin emails can be any domain, others must use @mahindrauniversity.edu.in`
    }
  },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'faculty', 'admin'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// We don't need to override validators since we've updated them
const User = mongoose.model('User', userSchema);

// Admin user data with original emails
const adminUsers = [
  {
    name: 'Vidhita Reddy Maddi',
    email: 'themvr198@gmail.com',
    password: 'FYProjexmu',
    role: 'admin'
  },
  {
    name: 'Srija lukka',
    email: 'Srijalukka222@gmail.com',
    password: 'Ammu@123456',
    role: 'admin'
  },
  {
    name: 'Parthavi K',
    email: 'kparthavi1905@gmail.com',
    password: 'Honeybee19',
    role: 'admin'
  },
  {
    name: 'Ankita Sarkar',
    email: 'ankitatuski@gmail.com',
    password: 'ankita@9903',
    role: 'admin'
  },
  {
    name: 'Veda Sri B',
    email: 'bvedasri22@gmail.com',
    password: 'Veda1234',
    role: 'admin'
  }
];

// Function to create admin users
async function createAdmins() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB successfully');

    // For each admin user
    for (const adminData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (existingUser) {
        console.log(`User with email ${adminData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Create user with hashed password
      const newAdmin = new User({
        ...adminData,
        password: hashedPassword
      });

      // Save user to database
      await newAdmin.save();
      console.log(`Admin user ${adminData.name} created successfully!`);
    }

    console.log('All admin users processed. Check above for results.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin users:', error);
    process.exit(1);
  }
}

// Run the function
createAdmins();
