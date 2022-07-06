import { LightningElement, api } from 'lwc';
import fetchRecords from '@salesforce/apex/ForeCastController.fetchRecords';
import saveRecords from '@salesforce/apex/ForeCastController.saveRecords';
const Months = new Map([
  ['1', 'Jan'],
  ['2', 'Feb'],
  ['3', 'Mar'],
  ['4', 'Apr'],
  ['5', 'May'],
  ['6', 'Jun'],
  ['7', 'Jul'],
  ['8', 'Aug'],
  ['9', 'Sep'],
  ['10', 'Oct'],
  ['11', 'Nov'],
  ['12', 'Dec'],
]);

export default class ForeCastsComponent extends LightningElement {
    @api recordId;
    headers;
    foreCastList = [];
  months=Months;

    connectedCallback(){
        setTimeout(() => {
          fetchRecords({recordId: this.recordId})
          .then(data=>{  
            this.foreCastList = data;
            let headervalues=[];
            this.foreCastList.forEach(element => {
              headervalues.push({key:element.Month__c, value:Months.get(element.Month__c)});
            });
            this.headers = headervalues;
          }).catch(error =>{
            this.error = error;
            this.foreCastList = undefined;
        }) },5);
    }
    handleLabourChange(event){
      let foundelement = this.foreCastList.find(ele => ele.Id == event.target.dataset.id);
        foundelement.Labour__c = event.target.value;
        this.foreCastList = [...this.foreCastList];
    }
    handleMaterialChange(event){
      let foundelement = this.foreCastList.find(ele => ele.Id == event.target.dataset.id);
        foundelement.Materials__c = event.target.value;
        this.foreCastList = [...this.foreCastList];

    }
    handleFixedCostChange(event){
      let foundelement = this.foreCastList.find(ele => ele.Id == event.target.dataset.id);
      foundelement.Fixed_Costs__c = event.target.value;
      this.foreCastList = [...this.foreCastList];
    }
    handleSave(){
      saveRecords({foreCastList: this.foreCastList})
      .then(data=>{  
        this.connectedCallback();
      }).catch(error =>{
        this.error = error;
        this.foreCastList = undefined;
    })
  }

}