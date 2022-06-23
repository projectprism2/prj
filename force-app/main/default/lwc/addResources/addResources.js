import { LightningElement, api } from "lwc";
import fetchResources from '@salesforce/apex/AddResources.fetchResources';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class AddResources extends  NavigationMixin(LightningElement) {
    @api recordId;
    newResource=false;
    columns;
    error;
    resourcesList;
    fldsItemValues = [];
    pageUrl;
    showRecordPage(){
        this.newResource=true;
    }
    handleSuccess(){
        this.newResource=false;
        //eval("$A.get('e.force:refreshView').fire();");
        this.connectedCallback();
    }
    
    onSubmitHandler(event){
        event.preventDefault();
        const fields = event.detail.fields;
        fields.Project_Version__c = this.recordId;
        this.template.querySelector('lightning-record-form').submit(fields);
    }

    connectedCallback(){
      setTimeout(() => {
        console.log('$recordId'+this.recordId);
        fetchResources({versionId: this.recordId})
        .then(data=>{  
            console.log(JSON.stringify(data));
            let items = []; //local array to prepare columns
            for(let i=0; i<data.columns.length; i++){
                if(data.columns[i].fieldName == 'Resource__r.Name'){
                    data.columns[i].label = 'Resource Name';
                }
                items = [...items ,{label: data.columns[i].label, 
                    fieldName: data.columns[i].fieldName, editable:data.columns[i].editable, type:data.columns[i].dataType}];
                
            }
            let resourcesArray = [];
           for (let row of data.records) {
                // this const stroes a single flattened row. 
                const flattenedRow = {}
                
                // get keys of a single row — Name, Phone, LeadSource and etc
                let rowKeys = Object.keys(row); 
                //iterate 
                rowKeys.forEach((rowKey) => {
                    //get the value of each key of a single row. John, 999-999-999, Web and etc
                    const singleNodeValue = row[rowKey];
                    //check if the value is a node(object) or a string
                    if(singleNodeValue.constructor === Object){
                        //if it's an object flatten it
                        this._flatten(singleNodeValue, flattenedRow, rowKey)        
                    }else{
                        //if it’s a normal string push it to the flattenedRow array
                        flattenedRow[rowKey] = singleNodeValue;
                    }
                });
               
                //push all the flattened rows to the final array 
                resourcesArray.push(flattenedRow);
            }
            this.resourcesList = resourcesArray;
            this.columns =items;
            this.error = undefined;
            console.log(this.columns);
        })
        .catch(error =>{
            this.error = error;
            console.log('error',JSON.stringify(error));
            this.resourcesList = undefined;
        }) },5);
    }

    handleSave(event) {
        this.fldsItemValues = event.detail.draftValues;
        const inputsItems = this.fldsItemValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        const promises = inputsItems.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            this.fldsItemValues = [];
            return this.refresh();
        }).catch(error => {
            console.log(error);
            console.log(JSON.stringify(error.body.output.errors[0].message));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body.output.errors[0].message,
                    variant: 'error'
                })
            );
        }).finally(() => {
            this.fldsItemValues = [];
            this.connectedCallback();
        });
    }

    _flatten = (nodeValue, flattenedRow, nodeName) => {        
        let rowKeys = Object.keys(nodeValue);
        rowKeys.forEach((key) => {
            let finalKey = nodeName + '.'+ key;
            flattenedRow[finalKey] = nodeValue[key];
        })
    }
    
}