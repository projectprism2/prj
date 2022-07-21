import { LightningElement, api } from 'lwc';
import fetchRecords from '@salesforce/apex/ForecastController.fetchRecords';
import saveForecastRecords from '@salesforce/apex/ForecastController.saveForecastRecords';
import saveAggregatorRecords from '@salesforce/apex/ForecastController.saveAggregatorRecords';
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
	forecastList;
	aggregatorHeaders;
	aggregatorList;
	totalAmountsList = [];
	projectVersion = {};
	objPercentageSpent = {};
	months=Months;
	// currentMonth = new Date().getMonth();
	currentYear;
	activeSections = ['BudgetSummary','ForecastModelling','ExpenseAggregator'];

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
				console.log('data', data);
				this.projectVersion = data;
				this.totalAmountsList = data?.totalAmounts;
				this.objPercentageSpent = data?.percentageSpent;
				this.forecastList = data?.forecasts;
				let tempHeaderValues=[];
				this.forecastList?.forEach(element => {
					tempHeaderValues.push({key:element.month+element.year, value: element.headerValue});
				});
				this.headers = tempHeaderValues;
				this.aggregatorList = data?.aggregators;
				tempHeaderValues = [];
				this.aggregatorList?.forEach(element => {
					tempHeaderValues.push({key:element.month+element.year, value: element.headerValue});
				});
				this.aggregatorHeaders = tempHeaderValues;

			}).catch(error =>{
				this.error = error;
				this.forecastList = undefined;
				this.aggregatorList = undefined;
				this.projectVersion = undefined;
				this.totalAmountsList = undefined;
				this.objPercentageSpent = undefined;
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Error',
						message: error?.body?.message,
						variant: 'error',
					}),
				);
				console.error(error);
			})
	}

	handleResourceChange(event){
		let fRec = this.forecastList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.resourceAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.forecastList = [...this.forecastList];
	}
	handleMaterialChange(event){
		let fRec = this.forecastList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.materialAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.forecastList = [...this.forecastList];

	}
	handleFixedCostChange(event){
		let fRec = this.forecastList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.fixedAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.forecastList = [...this.forecastList];
	}
	handleSave(){
		saveForecastRecords({forecastList: this.forecastList})
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
			console.error(error);
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

	handleAggregatorResourceChange(event){
		let fRec = this.aggregatorList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.resourceAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.aggregatorList = [...this.aggregatorList];
	}
	handleAggregatorMaterialChange(event){
		let fRec = this.aggregatorList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.materialAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.aggregatorList = [...this.aggregatorList];
	}
	handleAggregatorFixedCostChange(event){
		let fRec = this.aggregatorList.find(ele => ele.recordId == event.target.dataset.id);
		fRec.fixedAmount = event.target.value ? event.target.value: 0;
		this.calcTotal(fRec);
		// fRec.total = Number(fRec.resourceAmount) + Number(fRec.materialAmount) + Number(fRec.fixedAmount);
		this.aggregatorList = [...this.aggregatorList];
	}
	handleAggregatorSave(){
		saveAggregatorRecords({aggregatorList: this.aggregatorList})
		.then(data=>{  
			this.connectedCallback();
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Success',
					message: 'Actual costs are saved sucessfully',
					variant: 'success',
				}),
			);
		}).catch(error =>{
			this.error = error;
			console.error(error);
			this.aggregatorList = undefined;
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Error',
					message: error?.body?.message,
					variant: 'error',
				}),
			);
		})
	}

	calcTotal(fRec){
		fRec.total = 0;
		if(fRec.resourceAmount){
			fRec.total += Number(fRec.resourceAmount);
		}
		if(fRec.materialAmount){
			fRec.total += Number(fRec.materialAmount);
		}
		if(fRec.fixedAmount){
			fRec.total += Number(fRec.fixedAmount);
		}		
	}

	handleRefreshData(){
		this.loadData();
	}

}