import { Database } from './Database';
import { Layout } from '../Pages/Layout/Layout';
import { AuthPage } from '../Pages/AuthPage/AuthPage';
import { RegistrationPage } from '../Pages/RegistrationPage/RegistrationPage';
import { Main } from '../Pages/Main/Main';
import { MyGroups } from '../Pages/MyGroups/MyGroups';
import { AccountPage } from '../Pages/AccountPage/AccountPage';

import { IGroupDataAll, IDataForCreateGroup } from '../Interfaces/IGroupData';
import { TransactionsList } from '../Pages/TransactionsList/transactionsList';
import { dataTransList } from '../Data/dataTransList';
import { INotification, Notifications, TypeOfNotifications } from './Notifications';
import { INewMessage, Messenger } from '../Pages/Messenger/Messenger';
import { Contacts, ISearchUserData } from '../Pages/Contacts/Contacts';


export interface IHandlers {
  messages: any;
  groups: any;
  transactions: any;
  contacts: any;
}

export class App {
  private database: Database;
  private layout: Layout;
  private authPage: AuthPage;
  private regPage: RegistrationPage;
  private mainPage: Main;
  private groups: MyGroups;
  private accountPage: AccountPage;
  private transactionsList: TransactionsList;
  private notifications: Notifications;
  private messenger: Messenger;
  private contacts: Contacts;
  private contactsHandler: void;
  private messageHandler: (snapshot: any) => void;
  private transactionHandler: (snapshot: any) => void;
  private groupHandler: (snapshot: any) => void;

  constructor() {
    this.database = Database.create();
    this.init();
  }

  static create() {
    return new App();
  }

  init() {
    this.database.onUserIsLogin = this.isUserLogin.bind(this);
    this.database.init();
  }

  isUserLogin(state: boolean, uid?: string) {
    if (state) {
      // user signin
      this.layout = Layout.create('#app');
      this.layout.render();

      this.startNotification();

      // SIDEBAR
      this.layout.onSignOut = this.onSignOut.bind(this);
      this.layout.onStatisticsPage = this.onStatisticsPage.bind(this);
      this.layout.onMainPage = this.onMainPage.bind(this);
      this.layout.onGroupsPage = this.onGroupsPage.bind(this);
      this.layout.onTransactionsPage = this.onTransactionsPage.bind(this);
      this.layout.onSettingsPage = this.onSettingsPage.bind(this);
      this.layout.onHelpPage = this.onHelpPage.bind(this);
      this.layout.onSignOut = this.onSignOut.bind(this);
      this.layout.onAccountPage = this.onAccountPage.bind(this);
      this.layout.onMessagesPage = this.onMessagesPage.bind(this);
      this.layout.onContactsPage = this.onContactsPage.bind(this);

      this.accountPage = AccountPage.create('.main');
      this.mainPage = Main.create('.main');

      this.database.getUserInfo(uid, [
        this.mainPage.render,
        this.layout.setSidebarData,
      ]);

      this.groups = MyGroups.create('.main');
      this.groups.onCreateNewGroup = this.onCreateNewGroup.bind(this);
      this.groups.onAddMember = this.onAddGroupMember.bind(this);

      this.transactionsList = TransactionsList.create('.main');
      this.transactionsList.onTransactionSubmit = this.onTransactionSubmit.bind(this);

      this.messenger = Messenger.create('.main');
      this.messenger.onAddRecipient = this.onAddRecipientToMessage.bind(this);
      this.messenger.sendNewMessage = this.onSendNewMessage.bind(this);
      this.messenger.onAnswerMessage = this.onAnswerMessage.bind(this);
      this.messenger.fillContactsList = this.fillContactsList.bind(this);

      this.contacts = Contacts.create('.main');
      this.contacts.addUserToContacts = this.onAddUserToContacts.bind(this);
      this.contacts.onChangeContactState = this.onChangeContactState.bind(this);

    } else {
      console.log(`isUserLogon = ${state}`);
      this.authPage = AuthPage.create('#app');
      this.authPage.onLoadSignInPage = this.loadSignInPage.bind(this);
      this.authPage.onGoogleReg = this.onGoogleReg.bind(this);
      this.authPage.onLogin = this.onLogin.bind(this);

      this.regPage = RegistrationPage.create('#app');
      this.regPage.onSignIn = this.onSignIn.bind(this);
      this.regPage.goToLoginPage = this.loadLoginPage.bind(this);
      this.regPage.onGoogleReg = this.onGoogleReg.bind(this);

      this.authPage.render();
    }
  }

  onSignOut(): any {
    this.database.signOut();
    this.database.init();
  }

  onSignIn(email: string, password: string, name: string): void {
    this.database.createUserByEmail(
      email,
      password,
      name,
      this.regPage.showErrorMessage,
    );
  }

  onLogin(email: string, password: string): void {
    this.database.loginUserByEmail(
      email,
      password,
      this.authPage.showErrorMessage,
    );
  }

  onMainPage() {
    this.deleteHandlers();
    const uid: string = this.database.uid;
    this.database.getUserInfo(uid, [this.mainPage.render]);

  }

  async onAccountPage() {
    this.deleteHandlers();
    const uid: string = this.database.uid;
    await this.database.getUserInfo(uid, [this.accountPage.render]);

    await this.database.getCurrenciesOrLangsOrThemes(uid, this.accountPage.renderCurrencyOrLangOrTheme, 'currency');
    await this.database.getCurrenciesOrLangsOrThemes(uid, this.accountPage.renderCurrencyOrLangOrTheme, 'language');
    await this.database.getCurrenciesOrLangsOrThemes(uid, this.accountPage.renderCurrencyOrLangOrTheme, 'theme');

    this.accountPage.events();
  }

  onContactsPage() {
    this.deleteHandlers();
    this.contacts.render();
    this.contactsHandler = this.database.contactsHandler(this.contacts.addContactToList);
    this.database.getContactsList(this.contactsHandler);
  }

  onGroupsPage() {
    this.deleteHandlers();
    this.notifications.groupCount = 0;
    this.notifications.setNotificationMark(TypeOfNotifications.Group, 0);

    this.groups.render();
    // this.database.getGroupList(this.groups.createGroupList);
    this.groupHandler = this.database.groupHandler(this.groups.createGroupList);

    this.database.getGroupList(this.groupHandler);
  }

  onTransactionsPage() {
    this.deleteHandlers();
    this.notifications.transactionCount = 0;
    this.notifications.setNotificationMark(TypeOfNotifications.Transaction, 0);

    this.transactionsList.render(dataTransList);
    this.transactionsList.newTrans.onCreateTransaction = this.onCreateTransaction.bind(this);
    this.transactionsList.newTrans.onShowMembersOfGroup = this.onShowMembersOfGroup.bind(this);
    this.database.getCurrencyList(this.transactionsList.newTrans.addCurrencyList);
    this.database.getGroupsListForTransaction(this.transactionsList.newTrans.addGroupList);
    this.database.getMembersOfGroupFirst(this.transactionsList.newTrans.addMembersOfGroup);
  }

  onMessagesPage() {
    this.deleteHandlers();
    this.notifications.messageCount = 0;
    this.notifications.setNotificationMark(TypeOfNotifications.Message, 0);

    this.messenger.render();
    this.messageHandler = this.database.messageHandler(this.messenger.addMessageToList, this.messenger.setUserDataInMessage);
    this.database.getMessageList(this.messageHandler);
  }

  onStatisticsPage() {
    this.deleteHandlers();
    console.log('Load Statistics Page!');
  }

  onSettingsPage() {
    this.deleteHandlers();
    console.log('Load Settings Page!');
  }

  onHelpPage() {
    this.deleteHandlers();
    console.log('Load Help Page!');
  }

  onGoogleReg() {
    this.database.createUserByGoogle(this.regPage.showErrorMessage);
  }

  loadSignInPage() {
    this.regPage.render();
  }

  loadLoginPage() {
    this.authPage.render();
  }

  onCreateNewGroup(data: IGroupDataAll) {
    const userArray: string[] = data.userList;
    const userId = this.database.uid;
    const currentGroup = data.currentGroup;

    // check self in Users List
    if (!userArray.includes(userId)) {
      userArray.push(userId);
    }

    const dataForCreateGroup: IDataForCreateGroup = {
      groupData: data.groupData,
      userList: userArray,
      currentGroup: currentGroup,
      userId: userId
    };
    this.database.createNewGroup(dataForCreateGroup);
  }

  onTransactionSubmit(i: number) {
    dataTransList.transactions[i].submit = true;
    console.log('submit transaction');
  }

  onAddGroupMember(accountName: string) {
    this.database.findUserByName(accountName, this.groups.addMembersGroup);
  }

  onCreateTransaction(data: any) {
    this.database.setDataTransaction(data);
  }

  onShowMembersOfGroup(groupID: string) {
    this.database.getMembersOfGroup(groupID, this.transactionsList.newTrans.addMembersOfGroup);
  }

  onAddRecipientToMessage(accountName: string) {
    this.database.findUserByName(accountName, this.messenger.addUserForSendMessage, this.messenger.errorAddUserForSendMessage);
  }

  onSendNewMessage(data: INewMessage): void {
    this.database.createNewMessage(data);
  }

  onAnswerMessage(userId: string) {
    this.database.getUserInfo(userId, [this.messenger.callAnswerModal]);
  }

  startNotification(): void {
    const groupsEl: NodeListOf<Element> = document.querySelectorAll('.sidebarGroupsLink .badge');
    const transactionsEl: NodeListOf<Element> = document.querySelectorAll('.sidebarTransactionsLink .badge');
    const messagesEl: NodeListOf<Element> = document.querySelectorAll('.sidebarMessagesLink .badge');
    const contactsEl: NodeListOf<Element> = document.querySelectorAll('.sidebarContactsLink .badge');

    const notificationElements: INotification = {
      groupsEl,
      transactionsEl,
      messagesEl,
      contactsEl,
    };
    this.notifications = Notifications.create(notificationElements);

    this.database.countNewMessage(this.notifications.setNotificationMark);
    this.database.countGroupsInvite(this.notifications.setNotificationMark);
    this.database.countTransactionInvite(this.notifications.setNotificationMark);
    this.database.countContactsInvite(this.notifications.setNotificationMark);
  }

  deleteHandlers() {
    const handlers: IHandlers = {
      messages: this.messageHandler,
      groups: this.groupHandler,
      transactions: this.transactionHandler,
      contacts: this.contactsHandler,
    };

    this.database.deleteHandlers(handlers);
  }

  onAddUserToContacts(userData: ISearchUserData, errorHandler: (message: string) => void): void {
    this.database.addUserToContacts(userData, errorHandler);
  }

  onChangeContactState(contactId: string, state: string): void {
    if (state === 'approve') {
      this.notifications.decreaseNotificationMark(TypeOfNotifications.Contact);
    }
    if (state === 'decline') {
      this.database.deleteContact(this.database.uid, contactId);
    } else {
      this.database.changeContactState(contactId, state);
    }
  }

  fillContactsList() {

    const renderContact = this.database.contactsHandler(this.messenger.addContactsToList);

    this.database.getContactsList(renderContact);
  }

  // createUser(uid: string) {
  //   const form: HTMLFormElement = document.querySelector('#my-form');
  //   const formData: { [k: string]: any } = getFormData(form);
  //
  //   const storageRef = firebase.storage().ref();
  //   const userRef = firebase.database().ref(`User/${uid}`);
  //   const file = document.querySelector('#avatar').files[0];
  //
  //   const metadata = {
  //     'contentType': file.type,
  //   };
  //
  //   storageRef.child('images/' + file.name).put(file, metadata).then(function(snapshot) {
  //     snapshot.ref.getDownloadURL()
  //       .then((url) => {
  //         formData['avatar'] = url;
  //       })
  //       .then(formData => {
  //         console.log('formData', formData);
  //         userRef.set(formData);
  //       })
  //       .catch(error => {
  //         console.log(error.code);
  //         console.log(error.message);
  //       });
  //   });
  // }

  // createBasicTables() {
  //   // THEMES
  //   const themeData1 = {
  //     name: 'Light',
  //   };
  //   const themeData2 = {
  //     name: 'Dark',
  //   };
  //   const themeBase1 = firebase.database().ref(`Theme/Light`);
  //   const themeBase2 = firebase.database().ref(`Theme/Dark`);
  //   themeBase1.set(themeData1);
  //   themeBase2.set(themeData2);
  //
  //   //  CURRENCY
  //   const currency1 = {
  //     name: 'Доллар США',
  //   };
  //   const currency2 = {
  //     name: 'Беларусский Рубль',
  //   };
  //   const currencyBase1 = firebase.database().ref(`Currency/USD`);
  //   const currencyBase2 = firebase.database().ref(`Currency/BYN`);
  //   currencyBase1.set(currency1);
  //   currencyBase2.set(currency2);
  //   //
  //   // LANGUAGE
  //   const lang1 = {
  //     name: 'ENG',
  //   };
  //   const lang2 = {
  //     name: 'RU',
  //   };
  //   const lang3 = {
  //     name: 'BEL',
  //   };
  //   const langBase1 = firebase.database().ref(`Language/ENG`);
  //   const langBase2 = firebase.database().ref(`Language/RU`);
  //   const langBase3 = firebase.database().ref(`Language/BEL`);
  //   langBase1.set(lang1);
  //   langBase2.set(lang2);
  //   langBase3.set(lang3);
  // }
}
