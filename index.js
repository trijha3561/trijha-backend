const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const morgan = require('morgan'); 
const app = express();
const port = 3001;
const credentials = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: "https://trijha-new.firebaseio.com",
});

// Initialize Firestore
const db = admin.firestore();

app.use(morgan('dev'));

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  credentials: true // Enable credentials if needed
}));

app.use(express.json());

// GET route to display users
app.get('/', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    res.json({
      message: "Achieved Backend Integration",
      people: ["Soham", "Nikunj", "Nakshatra"],
      users, // Include users from Firestore
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST route to verify Google sign-in and create/authenticate user
app.post('/google-signup', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User exists:', userData);
      res.json({ message: 'Welcome back!', user: userData });
    } else {
      const newUser = {
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        createdAt: new Date().toISOString(),
      };

      await userDocRef.set(newUser);
      console.log('New user created:', newUser);
      res.json({ message: 'User signed up via Google', user: newUser });
    }
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// New GET route to display the user's cart items
app.get('/cart', async (req, res) => {
  const { idToken } = req.query; // Assuming the token is passed as a query parameter

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user document from the 'users' collection
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User data fetched:', userData);
      res.json({ message: 'Fetched user cart successfully', cart: userData.cart || [] }); // Return the cart items
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error retrieving user cart:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// POST route to update the cart
app.post('/cart/update', async (req, res) => {
  const { cartItems, idToken } = req.body;

  if (!idToken) {
    return res.status(401).json({ error: 'ID token is required' });
  }

  try {
    // Verify ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user document from the 'users' collection
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User document does not exist' });
    }

    // Update the cart in the user document
    await userRef.update({
      cart: cartItems // Update the cart with new quantities
    });

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// POST route to save checkout form details
app.post('/save-details', async (req, res) => {
  const { idToken, formDetails } = req.body;

  if (!idToken || !formDetails) {
    return res.status(400).json({ error: 'ID token and form details are required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Create a hashmap for form details
    const existingDetails = userData.details || {}; // If no details exist, initialize an empty object
    const detailsCount = Object.keys(existingDetails).length + 1;
    const newDetailKey = `Details ${detailsCount}`;

    // Save the new form details in Firestore under the user document
    await userDocRef.update({
      details: {
        ...existingDetails,
        [newDetailKey]: formDetails,
      },
    });

    res.json({ message: 'Details saved successfully' });
  } catch (error) {
    console.error('Error saving form details:', error);
    res.status(500).json({ error: 'Failed to save details' });
  }
});

//getting the user details (address etc.)
app.get('/get-details', async (req, res) => {
  const { idToken } = req.query; // Get the ID token from the query parameters

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    // Verify the ID token and get the user's UID
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch the user's document from Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const details = userData.details || {}; // Fetch the details array or return an empty object if none exists

    // Send the details back to the client
    return res.json({ details });
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
