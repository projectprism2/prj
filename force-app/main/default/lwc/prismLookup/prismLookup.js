import { LightningElement, track, api,wire } from "lwc";
import findRecords from "@salesforce/apex/prism_lookupCtrlr.findRecords";
/*import updateReferenceRecords from "@salesforce/apex/prism_lookupCtrlr.updateReferenceRecordInILS";*/
import formFactorPropertyName from "@salesforce/client/formFactor";
import { createRecord } from "lightning/uiRecordApi";
export default class PrismLookup extends LightningElement {
  @track records;
  @track error;
  @track selectedRecord;
  @api index;
  @api relationshipfield;
  @api iconname = ""; // = "standard:account";
  @api objectName; // api name of object
  @api objectLabel = "Reference Data"; // label of object
  @api searchField;
  @api recordType = "";
  @api filter;
  @api label ;
  @api name;
  @api recordLabel;
  @api recordLabel2;
  @api recordLabel2Field;
  @api displaySecondField = false;
  @api fieldsToRetrieve = "Name,codeValue__c";
  @api fireEvent = false;
  @api placeHolderText = "Type and select from the list.";
  @api helpText;
  @api createRecordLicSys=false;
  @api isDisabled;
  @api recordId;
  @api uniqueId;
  @api searchWithAll = false;
  @api displayField = "Name";
  @api minLength = 0;
  @api maxLength = 80;
  @api maxLimit = "15";
  @api isRequired = false;
  @api className = ""; // ghv?
  @api customEmptyMessage = "Please make a selection.";
  @api loadingMessage = "Loading...";
  @api searchingMessage = "Searching...";
  @api messageOnSearchMenu =
    "You must select from the drop down eg. when you begin to enter 'street' ST will appear to select."; // need to work on
  @api displayMessageOnSearch = false;
  @api allowNewRecords = false;
  objectInfo={};
  @api newRecordFields = [
    {
      label: "Name",
      api: "Name",
      value: "",
      maxLength: 80,
      minLength: 0,
      isRequired: true,
      key: "farLookupNewName",
      type: "text",
      display:true,
    },
    {
      label: "Code",
      api: "codeValue__c",
      value: "",
      maxLength: 80,
      minLength: 0,
      isRequired: false,
      key: "farLookupNewCode",
      type: "text",
      display:false,
    }
    
  ];
  displayInput = false;
  @api inputVariant = "standard";
  openMenu = false;
  // recordLabel;
  isMobile = false;
  inited = false;
  idNumber;
  errorMessage;
  errorMessageNewRecord;
  isSearching = false;
  lastSearchedTerm;
  isModalOpen = false;
  clonedNewReecordFlds;

  @api validateInputSearchFields() {
    /*let retVal=true;
      this.errorMessage=undefined;
      if(this.isRequired && (this.recordId =='' || this.recordId ==undefined || this.recordId ==null)){
        retVal=false;
        this.errorMessage=this.customEmptyMessage;
      }
      return retVal;*/
    const isValid = [
      ...this.template.querySelectorAll(".search-input-lookup")
    ].reduce((validSoFar, inputField) => {
      inputField.reportValidity();
      return validSoFar && inputField.checkValidity();
    }, true);
    return isValid;
  }
  /*@wire(getObjectInfo, { objectApiName: this.objectName })
  objectInfo;
     getRecordTypeId() {
        const rtis = this.objectInfo.data.recordTypeInfos;
        return Object.keys(rtis).find(rti => rtis[rti].name == this.recordType);
    }*/
  /*constructor(){
        super();
        this.iconname = "standard:account";
        this.objectName = 'Account';
        this.searchField = 'Name';
    }*/

  get outerShellClass() {
    let retVal = "slds-form-element slds-lookup slds-is-open ";
    if (this.error) {
      retVal = retVal + "slds-has-error ";
    }
    if (this.isMobile) {
      retVal = retVal + "sl-lookup--mobile ";
    }
    if (this.openMenu) {
      retVal = retVal + "sl-lookup--open ";
    }
    retVal = retVal + this.className;
    return retVal;
  }
  /* get displayResults(){
        
        return (this.inited && this.records!= null && this.records!=undefined && this.records.length >0 && !this.errorMessage) ;
    }*/
  get displayNewRecordInputField() {
    return (
      this.isModalOpen &&
      this.clonedNewReecordFlds != null &&
      this.clonedNewReecordFlds != undefined &&
      this.clonedNewReecordFlds.length > 0
    );
  }
  get inputId() {
    return "strike-lookup-" + this.idNumber;
  }
  get displayPill() {
    let retVal =
      this.inited &&
      this.recordId != null &&
      this.recordId != undefined &&
      this.recordId != "" &&
      this.recordLabel != "" &&
      this.recordLabel != undefined &&
      this.recordLabel != null;

    return retVal;
  }
  get resultPositive() {
    return (
      this.inited &&
      this.displayMessageOnSearch &&
      this.records != null &&
      this.records != undefined &&
      this.records.length > 0
    );
  }
  get searchActive() {
    let retVal = "slds-hide";
    if (this.isSearching) retVal = "slds-lookup__menu";
    return retVal;
  }
  get searchActiveList() {
    let retVal = "slds-hide";
    if (this.isSearching) retVal = "slds-lookup__list";
    return retVal;
  }
  get inputName() {
    return "input-" + this.idNumber;
  }
  get disableClass() {
    let dsCls =
      "slds-form-element__control slds-input-has-icon slds-input-has-icon--right";
    if (this.isDisabled) dsCls = dsCls + " sl-disabled";
    return dsCls;
  }
  get pillContainerClass() {
    let retVal = "slds-wrap slds-pill_container";
    if (
      !(
        (this.selectedRecord != "" &&
          this.selectedRecord != null &&
          this.selectedRecord != undefined) ||
        !this.inited
      )
    )
      retVal = retVal + " slds-hide";
    return retVal;
  }
  get pillSubcontainerClass() {
    let retVal = "slds-pill slds-size--1-of-1";
    if (!this.inited) retVal = retVal + " sl-pill--loading";
    return retVal;
  }
  get pillContent() {
    let retVal =
      this.recordLabel != undefined &&
      this.recordLabel != null &&
      this.recordLabel != ""
        ? this.recordLabel
        : "";
    if (!this.inited) retVal = this.loadingMessage;
    return retVal;
  }
  get pillClass() {
    let retVal = "slds-button slds-button--icon slds-pill__remove";
    if (!this.inited || this.isDisabled) retVal = retVal + " slds-hide";
    return retVal;
  }
  get inputContainer() {
    let retVal = "sl-lookup__input_container";
    if (!this.isMobile)
      retVal = retVal + " slds-grid slds-grid--pull-padded-xx-small";
    if (
      !(
        this.inited &&
        this.selectedRecord != "" &&
        this.selectedRecord != null &&
        this.selectedRecord != undefined
      )
    )
      retVal = retVal + " slds-hide";
    return retVal;
  }
  get inputClass() {
    let retVal = "sl-lookup__input";
    if (!this.isMobile)
      retVal = retVal + " slds-col slds-p-horizontal--xx-small";
    return retVal;
  }
  get searchResultMessageContainer() {
    let retVal = "slds-hide";
    if (!this.isSearching && this.openMenu) retVal = "slds-lookup__menu";
    return retVal;
  }
  get searchResultMessage() {
    let retVal = "slds-hide";
    if (
      this.inited &&
      ((this.records != null && this.records.length == 0) ||
        (this.records == null &&
          this.errorMessage != undefined &&
          this.errorMessage != null))
    )
      retVal = "";
    return retVal;
  }
  get allowNewRecClass() {
    let retVal = "sl-lookup__new";
    if (!this.inited || this.isDisabled) retVal = retVal + " slds-hide";
    return retVal;
  }

  handleOnchange(event) {
    this.clearValues();
    const searchKey = event.detail.value;
    this.recordId = searchKey;
    this.lastSearchedTerm = searchKey;
    if (searchKey != undefined && searchKey != "" && searchKey != null) {
      this.isSearching = true;
      this.getSearchResult(searchKey, "", this.maxLimit, false);
    } else {
      this.records = null;
    }
  }
  getSearchResult(searchKey, recId, lmt, onInit) {
    if (onInit) {
      this.records = [];
    } else {
    }
    /* Call the Salesforce Apex class method to find the Records */
    findRecords({
      searchKey: searchKey,
      objectName: this.objectName,
      searchField: this.searchField,
      recordType: this.recordType,
      filter: this.filter,
      searchWithAll: this.searchWithAll,
      recordId: recId,
      maxLimit: lmt,
      fieldsToRetrieve: this.fieldsToRetrieve
    })
      .then((result) => {
        this.isSearching = false;
        if (
          result != null &&
          (result.isError == null || result.isError == "false")
        ) {
          this.records = JSON.parse(result.sObjectList);

          for (let i = 0; i < this.records.length; i++) {
            const rec = this.records[i];
            this.records[i].displayField = rec[this.displayField];
            if (
              this.recordLabel2Field != "" &&
              this.recordLabel2Field != null &&
              this.recordLabel2Field != undefined
            ) {
              this.records[i].displayField2 = rec[this.recordLabel2Field];
            }
          }
          this.error = undefined;
          this.errorMessage = undefined;
          if (!onInit) {
            this.openMenu = true;
          } else {
            let rec = JSON.parse(JSON.stringify(this.records[0]));
            this.recordLabel = rec[this.displayField];
            this.selectedRecord = rec;
            this.recordId = rec.Id;
            if (
              this.recordLabel2Field != "" &&
              this.recordLabel2Field != null &&
              this.recordLabel2Field != undefined
            )
              this.recordLabel2 = rec[this.recordLabel2Field];
            this.records = null;
            if (this.fireEvent) {
              if(this.uniqueId){
                this.selectedRecord.uniqueId=this.uniqueId;
              }
              const evtToFire = new CustomEvent("prismlookupselect", {
                detail: this.selectedRecord
              });
              /* eslint-disable no-console */
              //console.log( this.record.Id);
              /* fire the event to be handled on the Parent Component */
              this.dispatchEvent(evtToFire)
            }
          }
        } else {
          let err = {};
          err.details = {};
          err.details.body = {};
          err.details.body.message =
            result != null ? result.errorMessage : "Error searching records.";
          this.error = error;
          this.records = null;
          this.errorMessage = err.details.body.message;
        }
        if (onInit) {
          this.inited = true;
        }
      })
      .catch((error) => {
        this.error = error;
        this.errorMessage = error.details.body.message;
        this.records = null;
      });
  }
  handleSelect(event) {
    let selectedRecordId =
      event.currentTarget.id != undefined &&
      event.currentTarget.id != "" &&
      event.currentTarget.id != null
        ? event.currentTarget.id.split("-")[0]
        : "";
    /* eslint-disable no-console*/
    if (selectedRecordId != "") {
      let rec = this.records.find((record) => record.Id == selectedRecordId);
      this.selectedRecord = JSON.parse(JSON.stringify(rec));
      this.recordLabel = this.selectedRecord.displayField;
      this.recordId = selectedRecordId;
      if (
        this.recordLabel2Field != "" &&
        this.recordLabel2Field != null &&
        this.recordLabel2Field != undefined
      )
        this.recordLabel2 = this.selectedRecord[this.recordLabel2Field];
				this.selectedRecord.isNew=false;
      this.records = null;
      if (this.fireEvent) {
        if(this.uniqueId){
          this.selectedRecord.uniqueId=this.uniqueId;
        }
        const evtToFire = new CustomEvent("prismlookupselect", {
          detail: this.selectedRecord
        });
        this.dispatchEvent(evtToFire)
      }
    }
  }

  handleRemove(event) {
    event.preventDefault();
    if (this.fireEvent) {
      if(this.uniqueId){
        this.selectedRecord.uniqueId=this.uniqueId;
      }
      const evtToFire = new CustomEvent("prismlookupremove", {
        detail: JSON.parse(JSON.stringify(this.selectedRecord))
      });
      this.dispatchEvent(evtToFire)
    }
    this.clearValues();
  }
  handleError(event) {
    event.preventDefault();
    this.selectedRecord = undefined;
    this.records = null;
    this.recordLabel = undefined;
    this.recordLabel2 = undefined;
    this.error = undefined;
    this.errorMessage = undefined;
  }
  connectedCallback() {
    this.isMobile = formFactorPropertyName == "Small" ? true : false;
    if (this.isRequired && this.minLength == 0) {
      this.minLength = 1;
    }
    this.idNumber = Math.floor(1000 + Math.random() * 9000);
    if (
      this.recordId != "" &&
      this.recordId != undefined &&
      this.recordId != null
    ) {
      this.getSearchResult(this.recordLabel, this.recordId, 1, true);
    } else if (
      this.recordLabel != "" &&
      this.recordLabel != undefined &&
      this.recordLabel != null
    ) {
      this.getSearchResult(this.recordLabel, null, 1, true);
    } else {
      this.inited = true;
    }
    if (this.allowNewRecords) {
      this.clonedNewReecordFlds = JSON.parse(
        JSON.stringify(this.newRecordFields)
      );
    }
  }
  handleNewRecordClick(event) {
    event.preventDefault();
    this.isModalOpen = true;
    if (
      this.clonedNewReecordFlds == null ||
      this.clonedNewReecordFlds == undefined ||
      (this.clonedNewReecordFlds != null &&
        this.clonedNewReecordFlds != undefined &&
        this.clonedNewReecordFlds.length == 0)
    ) {
      this.errorMessageNewRecord =
        "No fields mentioned to save a new record. Please contact NSW Firearms Registry / System Admin.";
    }
  }
  closeModal(event) {
    this.isModalOpen = false;
    this.errorMessageNewRecord = undefined;
  }
  clearValues() {
    this.recordId = "";
    this.selectedRecord = undefined;
    this.records = null;
    this.recordLabel = undefined;
    this.recordLabel2 = undefined;
    this.error = undefined;
    this.errorMessage = undefined;
  }
  saveRecord(event) {
    
  }
  
  checkNewRecordFieldValidation() {
    const isValid = [
      ...this.template.querySelectorAll(".newRecordInLookup")
    ].reduce((validSoFar, inputField) => {
      inputField.reportValidity();
      return validSoFar && inputField.checkValidity();
    }, true);
    return isValid;
  }
  handleFieldValueUpdate(event) {
    event.preventDefault();
    const inputVal = event.detail.value;
    if (
      event.currentTarget.name != undefined &&
      event.currentTarget.name != "" &&
      event.currentTarget.name != null
    ) {
      for (let i = 0; i < this.clonedNewReecordFlds.length; i++) {
        const rec = this.clonedNewReecordFlds[i];
        if (this.clonedNewReecordFlds[i].api == event.currentTarget.name) {
          this.clonedNewReecordFlds[i].value = inputVal;
          break;
        }
      }
    }
  }

  createRecord() {
    const fields = {};
    for (let i = 0; i < this.clonedNewReecordFlds.length; i++) {
      fields[this.clonedNewReecordFlds[i].api] = this.clonedNewReecordFlds[
        i
      ].value;
      
    }
    //fields.recordTypeId=getRecordTypeId();
    const recordInput = { apiName: this.objectName, fields };
    createRecord(recordInput)
      .then((resultRec) => {
        let rec = JSON.parse(JSON.stringify(resultRec));
        if (rec.Id == null || rec.Id == undefined || rec.Id == "")
          rec.Id = rec.id;
        rec.displayField = rec.fields[this.displayField].value;
        rec[this.displayField] = rec.fields[this.displayField].value;
        if (
          this.recordLabel2Field != "" &&
          this.recordLabel2Field != null &&
          this.recordLabel2Field != undefined
        ) {
          rec.displayField2 = rec.fields[this.recordLabel2Field].value;
          this.recordLabel2 = rec.fields[this.recordLabel2Field].value;
          rec[this.displayField2] = rec.fields[this.displayField2].value;
        }
				rec.isNew=true;
        this.selectedRecord = JSON.parse(JSON.stringify(rec));
        this.recordLabel = this.selectedRecord.displayField;
        this.recordId = this.selectedRecord.Id;
        this.records = null;
        if (this.fireEvent) {
          if(this.uniqueId){
            this.selectedRecord.uniqueId=this.uniqueId;
          }
          const evtToFire = new CustomEvent("prismlookupselect", {
            detail: this.selectedRecord
          });
          this.dispatchEvent(evtToFire)
        }
        this.errorMessageNewRecord = undefined;
        this.clonedNewReecordFlds = JSON.parse(
          JSON.stringify(this.newRecordFields)
        );
        this.isModalOpen = false;
      })
      .catch((error) => {
        this.errorMessageNewRecord = error.details.body.message;
      });
  }
}