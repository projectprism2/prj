import { LightningElement, api } from 'lwc';
import fetchRecords from '@salesforce/apex/ForecastController.fetchRecords';
import saveRecords from '@salesforce/apex/ForecastController.saveRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
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

export default class ForecastsComponent extends LightningElement {
    @api recordId;
    headers;
    forecastList = [];
  months=Months;

    connectedCallback(){
        setTimeout(() => {
          fetchRecords({recordId: this.recordId})
          .then(data=>{  
            this.forecastList = data;
            let headervalues=[];
            this.forecastList.forEach(element => {
              headervalues.push({key:element.Month__c, value:Months.get(element.Month__c)});
            });
            this.headers = headervalues;
          }).catch(error =>{
            this.error = error;
            this.forecastList = undefined;
        }) },5);
    }
    handleLabourChange(event){
      let foundelement = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
        foundelement.Labour__c = event.target.value;
        this.forecastList = [...this.forecastList];
    }
    handleMaterialChange(event){
      let foundelement = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
        foundelement.Materials__c = event.target.value;
        this.forecastList = [...this.forecastList];

    }
    handleFixedCostChange(event){
      let foundelement = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
      foundelement.Fixed_Costs__c = event.target.value;
      this.forecastList = [...this.forecastList];
    }
    handleSave(){
      saveRecords({forecastList: this.forecastList})
      .then(data=>{  
        this.connectedCallback();
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Success',
              message: 'Forecast records saved sucessfully',
              variant: 'success',
          }),
      );
      }).catch(error =>{
        this.error = error;
        this.forecastList = undefined;
        this.dispatchEvent(
          new ShowToastEvent({
              title: 'Error',
              message: error.message,
              variant: 'error',
          }),
      );
    })
  }

}