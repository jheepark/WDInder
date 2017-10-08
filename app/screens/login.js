import Expo from 'expo'
import firebase from 'firebase'
import React, {Component} from 'react'
import {View, StyleSheet, ActivityIndicator} from 'react-native'
import {NavigationActions} from 'react-navigation'
import FacebookButton from '../components/facebookButton'


export default class Login extends Component {

  state = {
    showSpinner: true,
  }

  //login authentication
  componentDidMount() {
    // firebase.auth().signOut()
    firebase.auth().onAuthStateChanged(auth => {
      if (auth) {
        this.firebaseRef = firebase.database().ref('users') // creating a reference to this particular firebase call so that we can access it later.
        //the .on('value') means that our callback function will be executed everytime our users data is updated in firebase
        this.firebaseRef.child(auth.uid).on('value', snap => {
          const user = snap.val()
          if(user != null){
            this.firebaseRef.child(auth.uid).off('value') //this is going to stop callbacks from being executed when our user is updated.
            this.goHome(user)
          }
        })
      } else {
        this.setState({showSpinner:false})
      }
    })
  }

  goHome(user){
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({
          routeName: 'Home',
          params: {user}
        })]
    })
    this.props.navigation.dispatch(resetAction)

  }
  //facebook authentication setup
  authenticate = (token) => {
    const provider = firebase.auth.FacebookAuthProvider
    const credential = provider.credential(token)
    return firebase.auth().signInWithCredential(credential)
  }
  //firebase.google.com/docs/database.web/read-write
  createUser = (uid, userData) => {
    firebase.database().ref('users').child(uid).update({...userData, uid})
  }

  //taken from https://docs.expo.io/versions/latest/sdk/facebook.html
  login = async() => {
    this.setState({showSpinner:true})
    const APP_ID = '314966862304637'
    const options = {
      permissions: ['public_profile', 'email', 'user_birthday', 'user_work_history']
    }
    const {type, token} = await Expo.Facebook.logInWithReadPermissionsAsync(APP_ID, options)
    if (type === 'success') {
      const fields = [
        'id',
        'first_name',
        'last_name',
        'gender',
        'birthday',
        'work'
      ]
      const response = await fetch(`https://graph.facebook.com/me?fields=${fields.toString()}&access_token=${token}`)
      const userData = await response.json()
      const {uid} = await this.authenticate(token)
      this.createUser(uid, userData)
    }
  }
  render() {
    return (
      <View style={styles.container}>
        {this.state.showSpinner ?
          <ActivityIndicator animating={this.state.showSpinner} /> :
          <FacebookButton onPress={this.login} />
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})