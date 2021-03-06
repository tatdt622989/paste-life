import {
  Model,
  Note,
  Products,
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
import { TierResult } from 'detect-gpu';

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
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      color: {},
      passive: false,
    } as Model,
    modelFormat: null as null | Products,
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
        lastGet: '',
        pointCounter: 0,
      },
      email: '',
    } as UserData,
    dataLoaded: false,
    getPoint: null,
    loadingStr: '',
    quality: null,
    gpuTier: null as null | TierResult,
    isDebug: false,
    modalLoaded: false,
    functionMenuOpen: false,
  },
  mutations: {
    menuToggler(state, data) {
      state.isMenuOpen = data;
    },
    functionMenuToggler(state, data) {
      state.functionMenuOpen = data;
    },
    getHeight(state) {
      state.height = `${window.innerHeight}px`;
    },
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
    closeModal(state) {
      if (state.modal) {
        state.modal.hide();
      }
    },
    resetUserData(state) {
      state.userData = {
        modelData: [],
        noteData: [],
        name: '',
        pointInfo: {
          balance: 0,
          lastGet: '',
          pointCounter: 0,
        },
        email: '',
      };
    },
    updateLoadingStr(state, data) {
      state.loadingStr = data;
    },
    updateFormHint(state, data) {
      state.formHint = data;
    },
    updateDataLoadStatus(state, data) {
      state.dataLoaded = data;
    },
    updateNoteData(state, data) {
      state.userData.noteData = data;
    },
    updateModelData(state, data) {
      state.userData.modelData = data;
    },
    updateBalance(state, data) {
      state.userData.pointInfo.balance = data;
    },
    updateGetPoint(state, data) {
      state.getPoint = data;
    },
    updateUserData(state, data) {
      state.userData.modelData = data.modelData;
      state.userData.name = data.name;
      state.userData.pointInfo = data.pointInfo;
      state.userData.email = data.email;
      state.userData.noteData = data.noteData ? data.noteData : [];
    },
    updateQuality(state, data) {
      state.quality = data;
      if (state.modal) {
        state.modal.hide();
      }
    },
    updateGpuTier(state, data) {
      state.gpuTier = data;
    },
    updateModalLoaded(state, data) {
      state.modalLoaded = data;
    },
  },
  actions: {
    login({ dispatch, commit, state }, data) {
      commit('updateLoadingStr', '登入中');
      dispatch('openModal', {
        type: 'loading',
        asynchronous: true,
      });
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      const facebookProvider = new firebase.auth.FacebookAuthProvider();
      switch (data.type) {
        case 'google':
          sessionStorage.setItem('pending', '1');
          // googleProvider.setCustomParameters({ prompt: 'select_account' });
          firebase.auth().signInWithRedirect(googleProvider);
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
        // case 'facebook':
        //   facebookProvider.addScope('public_profile');
        //   firebase.auth().languageCode = 'zh-tw';
        //   facebookProvider.setCustomParameters({
        //     display: 'popup',
        //   });
        //   firebase
        //     .auth()
        //     .signInWithPopup(facebookProvider)
        //     .then((result) => {
        //       /** @type {firebase.auth.OAuthCredential} */
        //       const { credential } = result;
        //       // The signed-in user info.
        //       const { user } = result;
        //       const { accessToken }: any = credential;
        //       console.log(credential, user, accessToken);
        //     })
        //     .catch((error) => {
        //       // Handle Errors here.
        //       const errorCode = error.code;
        //       const errorMessage = error.message;
        //       // The email of the user's account used.
        //       const { email } = error;
        //       // The firebase.auth.AuthCredential type that was used.
        //       const { credential } = error;
        //     });
        //   break;
        default:
          break;
      }
    },
    async register({ dispatch, state }, data) {
      firebase.auth().createUserWithEmailAndPassword(data.email, data.password).then((result) => {
        state.formHint = '';
        if (result.user) {
          result.user.updateProfile({
            displayName: data.userName,
          }).then(() => {
            dispatch('updateUserInfo');
          }).catch((err) => {
            dispatch('updateToast', {
              type: 'error',
              content: err,
            });
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
      commit('updateLoadingStr', '購買中');
      dispatch('openModal', {
        type: 'loading',
        asynchronous: true,
      });
      const buyModel = firebase.functions().httpsCallable('buyModel');
      const result = await buyModel({ buyingModel: data })
        .then((res) => res)
        .catch((err) => {
          dispatch('updateToast', {
            type: 'error',
            content: err,
          });
          return null;
        });
      if (result) {
        if (result.data.status === 'ok') {
          if (result.data.msg === '購買成功') {
            await dispatch('getModelData');
            await dispatch('getBalance');
            dispatch('updateToast', {
              type: 'success',
              content: result.data.msg,
            });
            return true;
          }
          if (result.data.msg === '餘額不足，購買失敗') {
            dispatch('updateToast', {
              type: 'hint',
              content: result.data.msg,
            });
            let times = 0;
            const closeModal = setInterval(() => {
              if (times > 50 || state.modalLoaded) {
                commit('closeModal');
                clearInterval(closeModal);
              }
              times += 1;
            }, 100);
            return null;
          }
        } else {
          dispatch('updateToast', {
            type: 'error',
            content: result.data.msg,
          });
        }
      }
      return null;
    },
    signOut({ dispatch, commit, state }) {
      console.log('登入');
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
    getModelFormat({ state }) {
      db.ref('/products').once('value', (snapshot) => {
        state.modelFormat = snapshot.val();
      });
    },
    getPoint({ dispatch, commit, state }, data) {
      const getPoint = firebase.functions().httpsCallable('getPoint');
      getPoint({ type: data.type }).then((res) => {
        let times = 0;
        const closeModal = setInterval(() => {
          if (times > 50 || state.modalLoaded) {
            commit('closeModal');
            clearInterval(closeModal);
            if (res.data && res.data.status === 'ok') {
              if (res.data.point > 0) {
                dispatch('openModal', {
                  type: 'pointNotification',
                  asynchronous: false,
                });
                commit('updateGetPoint', res.data.point);
                dispatch('getBalance');
              } else {
                // dispatch('updateToast', {
                //   type: 'hint',
                //   content: res.data.msg,
                // });
              }
            }
          }
          times += 1;
        }, 100);
      }).catch((err) => {
        dispatch('updateToast', {
          type: 'error',
          content: err,
        });
      });
    },
    async getUserData({ dispatch, commit, state }) {
      if (state.userInfo) {
        let userData = await db.ref(`/users/${state.userInfo.uid}`).once('value').then((snapshot) => snapshot.val());
        if (!userData) {
          let displayName;
          if (state.userInfo?.isAnonymous) {
            displayName = '訪客';
          } else {
            displayName = state.userInfo?.displayName;
          }
          const newUserFormat = firebase.functions().httpsCallable('newUserFormat');
          await newUserFormat({ displayName }).then((res) => {
            if (res.data.userData) {
              userData = res.data.userData;
            }
          });
        }
        commit('updateUserData', userData);
        commit('menuToggler', false);
        let times = 0;
        const closeModal = setInterval(() => {
          if (times > 50 || state.modalLoaded) {
            commit('closeModal');
            clearInterval(closeModal);
            let guideState;
            try {
              guideState = Number(localStorage.getItem('guideState'));
            } catch (e) {
              localStorage.removeItem('guideState');
            }
            if (!guideState) {
              dispatch('openModal', {
                type: 'guide',
                asynchronous: false,
              });
            }
          }
          times += 1;
        }, 100);
      }
      return false;
    },
    async getBalance({ commit, state }) {
      if (state.userInfo) {
        const balance = await db.ref(`/users/${state.userInfo.uid}/pointInfo/balance`).once('value').then((snap) => snap.val());
        commit('updateBalance', balance);
      }
    },
    async getNoteData({ commit, state }) {
      if (state.userInfo) {
        let noteData = await db.ref(`/users/${state.userInfo.uid}/noteData`).once('value').then((snap) => snap.val());
        noteData = noteData.filter((obj: Note) => obj);
        commit('updateNoteData', noteData);
      }
    },
    async getModelData({ commit, state }) {
      if (state.userInfo) {
        const modelData = await db.ref(`/users/${state.userInfo.uid}/modelData`).once('value').then((snap) => snap.val());
        commit('updateModelData', modelData);
      }
    },
    async getAccountingData({ state }) {
      if (state.userInfo) {
        const accountingData = await db.ref(`/users/${state.userInfo.uid}/accountingData`).once('value').then((snap) => snap.val());
        console.log(accountingData);
        return accountingData;
      }
      return null;
    },
    updateToast({ commit }, data) {
      commit('addToast', data);
      setTimeout(() => {
        commit('removeToast');
      }, 3000);
    },
    async updateUserInfo({ dispatch, state, commit }) {
      firebase.auth().onAuthStateChanged((user) => {
        console.log(user);
        if (user) {
          state.userInfo = user;
          dispatch('getUserData').then(() => {
            state.dataLoaded = true;
          });
        } else {
          commit('resetUserData');
          state.userInfo = null;
        }
      });
    },
    async updateModelData({ dispatch, commit, state }, data) {
      const editModel = firebase.functions().httpsCallable('editModel');
      let isSuccess = false;
      await editModel(data).then((res) => {
        if (res.data.status === 'ok' && res.data.modelData) {
          commit('updateModelData', res.data.modelData);
          isSuccess = true;
        }
      });
      return isSuccess;
    },
    async updateNoteData({ dispatch, commit, state }, data) {
      let { noteData } = state.userData;
      let index = null;
      const note = data.data;
      commit('updateLoadingStr', '資料上傳中');
      dispatch('openModal', {
        type: 'loading',
        asynchronous: true,
      });
      if (state.userInfo) {
        switch (data.type) {
          case 'add':
            index = noteData.length;
            break;
          case 'edit':
            noteData.forEach((el: Note, i: number) => {
              if (el.id === data.data.id) {
                index = i;
              }
            });
            break;
          case 'delete':
            noteData = noteData.filter((el: Note) => el.id !== data.id);
            break;
          default:
            break;
        }
        if (data.type === 'delete') {
          await db.ref(`/users/${state.userInfo.uid}/noteData`).set(noteData);
        } else {
          await db.ref(`/users/${state.userInfo.uid}/noteData/${index}`).set(note);
        }
        await dispatch('getNoteData');
        if (data.type === 'edit') {
          dispatch('updateToast', {
            type: 'success',
            content: '編輯成功',
          });
        } else if (data.type === 'delete') {
          dispatch('updateToast', {
            type: 'success',
            content: '刪除成功',
          });
        }
      }
    },
    async updateAccountingData({ dispatch, commit, state }, data) {
      commit('updateLoadingStr', '資料上傳中');
      dispatch('openModal', {
        type: 'loading',
        asynchronous: true,
      });
      if (state.userInfo) {
        await db.ref(`/users/${state.userInfo.uid}/accountingData/${data.key}`).set(data.data);
        dispatch('getPoint', { type: 'accounting' });
      }
    },
    openModal({ commit, state }, data) {
      state.formHint = '';
      const el = document.getElementById(`${data.type}Modal`);
      let backdrop: boolean | 'static' | undefined = true;
      commit('updateModalLoaded', false);
      if (data.type === 'loading') {
        backdrop = 'static';
      }
      if (el) {
        if (data.asynchronous) {
          el.addEventListener('shown.bs.modal', () => {
            commit('updateModalLoaded', true);
          });
        }
        state.modal = new Modal(el, {
          backdrop,
        });
        state.modal.show();
      }
    },
    async getRedirectRes({ dispatch, commit, state }) {
      firebase.auth()
        .getRedirectResult()
        .then((result) => {
          if (result.credential) {
            /** @type {firebase.auth.OAuthCredential} */
            const { credential } = result;
            // This gives you a Google Access Token. You can use it to access the Google API.
            const token: any = (credential as any).accessToken;
          }
          // The signed-in user info.
          const { user } = result;
          console.log(user, result);
          if (user) {
            state.userInfo = user;
            dispatch('getUserData').then(() => {
              state.dataLoaded = true;
            });
          }
          sessionStorage.removeItem('pending');
        }).catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          dispatch('updateToast', {
            type: 'error',
            content: errorMessage,
          });
        });
    },
  },
  modules: {
  },
});
