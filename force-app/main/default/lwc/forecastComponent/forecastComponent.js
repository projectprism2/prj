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
	// currentMonth = new Date().getMonth();
	currentYear;
	activeSections = ['ForecastModelling'];

	connectedCallback(){
		setTimeout(() => {
			this.loadData();
		},5);
	}
	
	loadData(){
		fetchRecords({recordId: this.recordId})
			.then(data=>{ 
				this.currentYear =  new Date().getFullYear();
				// console.log('currentMonth', this.currentMonth);
				console.log('currentYear', this.currentYear);
				this.forecastList = data;
				let headervalues=[];
				this.forecastList.forEach(element => {
					headervalues.push({key:element.Month__c, value: Months.get(element.Month__c)+(this.currentYear != element.Year__c ? '\''+element.Year__c.toString().substring(2): '') });
				});
				this.headers = headervalues;
			}).catch(error =>{
				this.error = error;
				this.forecastList = undefined;
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Error',
						message: error?.body?.message,
						variant: 'error',
					}),
				);
			})
	}

	handleLabourChange(event){
		let fRec = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
		fRec.Labour__c = event.target.value;
		fRec.Total__c = Number(fRec.Labour__c) + Number(fRec.Materials__c) + Number(fRec.Fixed_Costs__c);
		this.forecastList = [...this.forecastList];
	}
	handleMaterialChange(event){
		let fRec = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
		fRec.Materials__c = event.target.value;
		fRec.Total__c = Number(fRec.Labour__c) + Number(fRec.Materials__c) + Number(fRec.Fixed_Costs__c);
		this.forecastList = [...this.forecastList];

	}
	handleFixedCostChange(event){
		let fRec = this.forecastList.find(ele => ele.Id == event.target.dataset.id);
		fRec.Fixed_Costs__c = event.target.value;
		fRec.Total__c = Number(fRec.Labour__c) + Number(fRec.Materials__c) + Number(fRec.Fixed_Costs__c);
		this.forecastList = [...this.forecastList];
	}
	handleSave(){
		saveRecords({forecastList: this.forecastList})
		.then(data=>{  
			this.connectedCallback();
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Success',
					message: 'Forecast records are saved sucessfully',
					variant: 'success',
				}),
			);
		}).catch(error =>{
			this.error = error;
			console.log(error);
			this.forecastList = undefined;
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Error',
					message: error?.body?.message,
					variant: 'error',
				}),
			);
		})
	}

	handleRefreshData(){
		this.loadData();
	}

}