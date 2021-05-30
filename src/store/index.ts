import {
  Model,
  Note,
  ToastMSG,
  UserData,
} from '@/types';
import { createStore, Store } from 'vuex';
import { Modal } from 'bootstrap';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/analytics';
import 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCvCRbDN7cTeJEsUsaLniB_p2LMxpf5sVc',
  authDomain: 'diary-box.firebaseapp.com',
  projectId: 'diary-box',
  storageBucket: 'diary-box.appspot.com',
  messagingSenderId: '857252808766',
  appId: '1:857252808766:web:f1f3fdcc47bad53545e96f',
  measurementId: 'G-LYH2T7DNKF',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.database();

export default createStore({
  state: {
    isMenuOpen: false as boolean,
    height: '' as string,
    toastMsgList: [] as Array<ToastMSG>,
    previewModel: '',
    defaultModelData: {
      name: 'can',
      id: '1',
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
      style: {
        color: null,
      },
      passive: false,
    } as Model,
    modelFormat: null,
    firebase: null,
    userInfo: null as null | firebase.User,
    formHint: '' as string,
    modal: null as null | Modal,
    userData: {
      modelData: [],
      noteData: [] as Array<Note>,
      name: '',
      pointInfo: {
        balance: 0,
      },
      email: '',
    } as UserData,
    dataLoaded: false,
    getPoint: null,
    loadingStr: '',
  },
  mutations: {
    menuToggler(state, data) {
      state.isMenuOpen = data;
    },
    getHeight(state) {
      state.height = `${window.innerHeight}px`;
    },
    // updateNote(state, data) {
    // },
    addToast(state, data) {
      state.toastMsgList.push(data);
    },
    removeToast(state, index) {
      if (typeof index === 'number') {
        state.toastMsgList.splice(index, 1);
      } else {
        state.toastMsgList.splice(0, 1);
      }
    },
    updateModel(state, data) {
      // if (data.type === 'add') {
      //   state.modelData.push(data.model);
      // }
    },
    openModal(state, data) {
      let el;
      state.formHint = '';
      switch (data) {
        case 'register':
          el = document.getElementById('registerModal');
          break;
        case 'login':
          el = document.getElementById('loginModal');
          break;
        case 'pointNotification':
          el = document.getElementById('pointNotificationModal');
          break;
        default:
          break;
      }
      if (el) {
        state.modal = new Modal(el);
        state.modal.show();
      }
    },
    updateFormHint(state, data) {
      state.formHint = data;
    },
    resetUserData(state) {
      state.userData = {
        modelData: [],
        noteData: [],
        name: '',
        pointInfo: {},
        email: '',
      };
    },
    updateDataLoadStatus(state, data) {
      state.dataLoaded = data;
    },
    updateNoteData(state, data) {
      state.userData.noteData = data;
    },
    updateGetPoint(state, data) {
      state.getPoint = data;
    },
  },
  actions: {
    updateToast({ commit, state }, data) {
      commit('addToast', data);
      setTimeout(() => {
        commit('removeToast');
      }, 3000);
    },
    async updateUserInfo({ state, commit, dispatch }) {
      firebase.auth().onAuthStateChanged((user) => {
        console.log('登入狀態改變', user);
        if (user) {
          state.userInfo = user;
          dispatch('getUserData').then(() => {
            state.dataLoaded = true;
          });
        } else {
          commit('resetUserData');
          state.userInfo = null;
        }
        if (state.modal) {
          state.modal.hide();
        }
      });
    },
    login({ dispatch, commit, state }, data) {
      const provider = new firebase.auth.GoogleAuthProvider();
      switch (data.type) {
        case 'google':
          firebase.auth().signInWithPopup(provider)
            .then((result) => {
              dispatch('updateUserInfo');
            })
            .catch((error) => {
              // Handle Errors here.
              const errorMessage = error.message;
              dispatch('updateToast', {
                type: 'error',
                content: errorMessage,
              });
            });
          break;
        case 'email':
          firebase.auth().signInWithEmailAndPassword(data.email, data.password)
            .then((userCredential) => {
              // Signed in
              dispatch('updateUserInfo');
            })
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;
              console.log(errorCode, errorMessage);
              if (errorCode.search('invalid-email') > 0) {
                state.formHint = '電子郵件格式錯誤';
              }
              if (errorCode.search('user-not-found') > 0) {
                state.formHint = '找不到用戶';
              }
              if (errorCode.search('wrong-password') > 0) {
                state.formHint = '密碼錯誤';
              }
            });
          break;
        case 'anonymous':
          firebase.auth().signInAnonymously()
            .then(() => {
              // Signed in..
              dispatch('updateUserInfo');
            })
            .catch((error) => {
              const errorMessage = error.message;
              dispatch('updateToast', {
                type: 'error',
                content: errorMessage,
              });
            });
          break;
        default:
          break;
      }
    },
    getModelFormat({ commit, state }) {
      db.ref('/products').once('value', (snapshot) => {
        console.log(snapshot.val());
        state.modelFormat = snapshot.val();
      });
    },
    async register({ commit, dispatch, state }, data) {
      firebase.auth().createUserWithEmailAndPassword(data.email, data.password).then((result) => {
        state.formHint = '';
        dispatch('updateToast', {
          type: 'success',
          content: '註冊成功',
        });
        console.log(result);
        if (result.user) {
          result.user.updateProfile({
            displayName: data.userName,
          }).then(() => {
            dispatch('updateUserInfo');
          });
        }
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        if (errorMessage.search('email-already-in-use') > 0) {
          state.formHint = '電子郵件已經被使用';
        }
        if (errorCode.search('invalid-email') > 0) {
          state.formHint = '電子郵件格式錯誤';
        }
        if (errorMessage.search('should be at least 6 characters') > 0) {
          state.formHint = '密碼需至少六個字';
        }
      });
    },
    async buyModel({ dispatch, commit, state }, data) {
      const buyModel = firebase.functions().httpsCallable('buyModel');
      buyModel({ buyingModel: data })
        .then((result) => {
          console.log(result);
          dispatch('getUserData');
          dispatch('updateToast', {
            type: 'success',
            content: result.data.msg,
          });
        });
    },
    signOut({ commit, dispatch, state }) {
      firebase.auth().signOut().then(() => {
        dispatch('updateToast', {
          type: 'success',
          content: '登出成功',
        });
        commit('resetUserData');
        state.userInfo = null;
        commit('menuToggler', false);
      }).catch((err) => {
        dispatch('updateToast', {
          type: 'error',
          content: err,
        });
      });
    },
    async getUserData({ dispatch, commit, state }) {
      console.log('取得使用者資料');
      if (state.userInfo) {
        await db.ref(`/users/${state.userInfo.uid}`).once('value', async (snapshot) => {
          let userData = snapshot.val();
          if (!userData) {
            let displayName;
            if (state.userInfo?.isAnonymous) {
              displayName = '訪客';
            } else {
              displayName = state.userInfo?.displayName;
            }
            const newUserFormat = firebase.functions().httpsCallable('newUserFormat');
            await newUserFormat({ displayName }).then((res) => {
              console.log('資料取得完畢', res);
              if (res.data.userData) {
                userData = res.data.userData;
              }
            });
          }
          state.userData.modelData = userData.modelData;
          state.userData.name = userData.name;
          state.userData.pointInfo = userData.pointInfo;
          state.userData.email = userData.email;
          state.userData.noteData = userData.noteData ? userData.noteData : [];
        });
        commit('menuToggler', false);
      }
      return false;
    },
    getPoint({ dispatch, commit, state }) {
      const getPoint = firebase.functions().httpsCallable('getPoint');
      getPoint().then((res) => {
        console.log(res);
        if (res.data && res.data.status === 'ok') {
          commit('openModal', 'pointNotification');
          commit('updateGetPoint', res.data.point);
        }
      });
    },
    async updateNoteData({ commit, state, dispatch }, data) {
      const noteData = [...state.userData.noteData];
      if (state.userInfo) {
        switch (data.type) {
          case 'add':
            noteData.push(data.data);
            break;
          default:
            break;
        }
        await db.ref(`/users/${state.userInfo.uid}/noteData`).set(noteData);
        commit('updateNoteData', noteData);
      }
    },
  },
  modules: {
  },
});
