import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAVHUs15KQgR5hhZbZIYWSLDe8XkukPtDU',
  authDomain: 'dev-lab-8afeb.firebaseapp.com',
  projectId: 'dev-lab-8afeb',
  storageBucket: 'dev-lab-8afeb.appspot.com',
  messagingSenderId: '513892361842',
  appId: '1:513892361842:web:8b69b9117ac5eb4db8c4eb',
  measurementId: 'G-VZL6C3M3N3',
}

firebase.initializeApp(firebaseConfig)

export default firebase
