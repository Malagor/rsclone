import { Page } from '../../Classes/Page';
import { divideSum } from './divideSum';
import { Modal } from 'bootstrap';
import { addMemberHTML } from './addMemberHTML';
export class NewTransaction extends Page {
  onCreateTransaction: any;

  constructor(element: string) {
    super(element);
  }

  static create(element: string): NewTransaction {
    return new NewTransaction(element);
  }

  render = (): void => {

    this.element.innerHTML = `
      <div class="new-trans modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Новая транзакция</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

          <div class="input-group mb-2">
            <span class="input-group-text">Группа</span>
            <select class="new-trans__groups-list form-select"></select>
          </div>

          <div class="input-group mb-2">
            <span class="input-group-text">Описание</span>
            <textarea class="new-trans__descr form-control"></textarea>
          </div>

          <div class="input-group mb-2">
            <span class="input-group-text w-30">Общая сумма</span>
            <input type="text" class="total-sum form-control w-50">
            <select class="new-trans__currency-list form-select w-20"></select>
          </div>

          <div class="add-check d-flex align-items-center mb-2">
            <div class="add-check__wrapper input-group">
              <label class="add-check__label" for="input-file">
                <div class="add-check__text">Добавить чек</div>
                <input id="input-file" type="file" accept="image/*" class="add-check__file" name="check">                 
              </label>              
            </div>
            <div class="add-check__icon-wrapper hidden" ><img class="add-check__icon" src="#" alt="check"></div>


            <div class="modal fade add-check__modal" id="check" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-2 d-flex flex-column">
                    <button type="button" class="btn-close align-self-end add-check__close-modal" aria-label="Close"></button>
                    <div class="p-2">
                      <img class="add-check__image src="#" alt="check">
                    </div>
                    
                </div>
              </div>
            </div> 

          </div>

         
    
         
          <div class="new-trans__members">
            <div class="new-trans__members-list d-flex flex-wrap justify-content-start"></div>        
            <button type="button" class="all-btn btn btn-secondary btn-sm">Выбрать всех</button>
          </div>

          <div class="checked-members"></div>

        </div>

        <div class="modal-footer">
          <button type="button" class="new-trans__create-btn btn btn-primary w-100" data-bs-dismiss="modal">Создать транзакцию</button>
        </div>
      </div>
    `;


    this.events();
  }

  addGroupList = (groupID: string, groupTitle: string, currentGroup: string) => {
    const groups: HTMLInputElement = document.querySelector('.new-trans__groups-list');
    const groupElement = document.createElement('option');
  
    if (groupTitle === currentGroup) {
      groupElement.setAttribute('selected', '');
    }
    groupElement.classList.add('new-trans__groups-item');
    groupElement.value = groupID;
    groupElement.innerText = groupTitle;
    groups.append(groupElement);
  }

  addMembersOfGroup = (userID: string, userName: string, userAvatar: string): void => {
   const members = document.querySelector('.new-trans__members-list');
   const userElement = document.createElement('div');
      userElement.classList.add('member', 'd-flex', 'flex-column', 'align-items-center');
      userElement.setAttribute('user-id', `${userID}`);
      userElement.innerHTML = `
        <div class="member__avatar">
          <img src="${userAvatar}" alt="#">
        </div>
        <div class="member__name">${userName}</div>
      `;
      members.append(userElement);   
      this._clickOnMember(userElement);   
  }

  addCurrencyList = (data: any) => {
    const currencySelect: HTMLFormElement = document.querySelector('.new-trans__currency-list');
    const optionHTML = `<option value=${data.icon}>${data.icon}</option>`;
    currencySelect.insertAdjacentHTML('beforeend', optionHTML);
  }

  _clickOnMember = (user: HTMLElement) => {
    user.addEventListener('click', () => {
      const userAvatar = user.querySelector('.member__avatar');
      const userName = user.querySelector('.member__name').innerHTML;
      const userID = user.getAttribute('user-id');
      userAvatar.classList.toggle('checked');
      if (userAvatar.classList.contains('checked')) {
        const checkedUserHTML = addMemberHTML(userID, userName, userAvatar.innerHTML);
        const ckeckedMembersList: HTMLElement = document.querySelector('.checked-members');
        ckeckedMembersList.insertAdjacentHTML('beforeend', checkedUserHTML);
      } else {
        const checkedMembers = document.querySelectorAll('.checked-member-wrapper');
        checkedMembers.forEach((memb) => {
          if (memb.querySelector('.checked-member__name').innerHTML === userName) {
            memb.remove();
          }
        });
      }
      divideSum();
    });  
  } 

  getDataforCreateTransaction = () => {

    const group: HTMLFormElement= document.querySelector('.new-trans__groups-list');
    const descr: HTMLFormElement = document.querySelector('.new-trans__descr');
    const totalSum: HTMLFormElement = document.querySelector('.total-sum');
    const currency: HTMLFormElement = document.querySelector('.new-trans__currency-list');
    const inputCheck: HTMLFormElement = document.querySelector('.add-check__file');
    const currentDate  = +(new Date());
    
    const userList: Array<any> = [];
    const checkedMembers = document.querySelectorAll('.checked-member-wrapper');
    checkedMembers.forEach((memb: HTMLElement) => {
      const user = {
        userID: memb.getAttribute('user-id'),
        cost: memb.querySelector('.checked-member__sum').value || memb.querySelector('.checked-member__sum').getAttribute('placeholder'),
        comment: memb.querySelector('.checked-member__comment').value,
        state: 'pending',
      };
      userList.push(user);
    });

    return {
      date: currentDate,
      totalCost: totalSum.value,
      groupID: group.value,
      descripion: descr.value,
      tillSlip: inputCheck.files[0],
      currency: currency.value,
      toUserList: userList,
    } 
  }

  protected events(): void {
    const groups: HTMLFormElement = document.querySelector('.new-trans__groups-list');
    const ckeckedMembersList: HTMLElement = document.querySelector('.checked-members');
    const allBtn: HTMLFormElement = document.querySelector('.all-btn');
    const sumInput: HTMLFormElement = document.querySelector('.total-sum');
   
    groups.addEventListener('change', () => {
      console.log (groups.value);
    });

    sumInput.addEventListener('keyup', () => {
      if (typeof +sumInput.value === 'number') {
        divideSum();
      }
    });

    allBtn.addEventListener('click', () => {
      const allMembers = document.querySelectorAll('.member');
      ckeckedMembersList.innerHTML = '';
      allMembers.forEach((user) => {
        const userAvatar = user.querySelector('.member__avatar');
        const userName = user.querySelector('.member__name').innerHTML;
        const userID = user.getAttribute('user-id');
        userAvatar.classList.add('checked');
        const checkedUserHTML = addMemberHTML(userID, userName, userAvatar.innerHTML);
        ckeckedMembersList.insertAdjacentHTML('beforeend', checkedUserHTML);
      });
      divideSum();
    });

    const inputCheck: HTMLFormElement = document.querySelector('.add-check__file');
    inputCheck.addEventListener('change', () => {
      if (inputCheck.value) {
        document.querySelector('.add-check__icon-wrapper').classList.remove('hidden');        
        const checkInModal: HTMLImageElement = document.querySelector('.add-check__image');
        const checkIcon:HTMLImageElement = document.querySelector('.add-check__icon');
        const reader: FileReader = new FileReader();
        reader.onload = (function (aImg1: HTMLImageElement, aImg2: HTMLImageElement ) {
          return (e: any): void => {
            aImg1.src = e.target.result;
            aImg2.src = e.target.result;
          };
        })(checkInModal, checkIcon);
        reader.readAsDataURL(inputCheck.files[0]);        
      }     
    });

    const createTransBtn = document.querySelector('.new-trans__create-btn');
    createTransBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const data = this.getDataforCreateTransaction();
      this.onCreateTransaction(data);
      console.log ('data', data);
    });

    const checkModal = new Modal(document.querySelector('.add-check__modal'));
    const btnOpenCheck: HTMLElement = document.querySelector('.add-check__icon-wrapper');
    const btnCloseCheck: HTMLElement = document.querySelector('.add-check__close-modal');

    btnOpenCheck.addEventListener('click',() => {
      checkModal.show();
    });

    btnCloseCheck.addEventListener('click', () => {
      checkModal.hide();
    });

  }
}
 