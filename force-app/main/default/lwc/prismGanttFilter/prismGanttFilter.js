import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjectFields from "@salesforce/apex/prism_ganttChartCtrlr.getAllFields";
import getObjectFieldsString from "@salesforce/apex/prism_ganttChartCtrlr.getFieldsString";
import saveObjectFieldsString from "@salesforce/apex/prism_ganttChartCtrlr.saveFieldsString";
import TickerSymbol from '@salesforce/schema/Account.TickerSymbol';
import { getFieldValue } from 'lightning/uiRecordApi';
import getRecordDtls from "@salesforce/apex/prism_ganttChartCtrlr.getQueryResults";
//import { RecordFieldDataType } from 'lightning/uiRecordApi';
export default class PrismGanttFilter extends LightningElement {

    @api supportingObjects='Project__c,Contact,Resource_Engagement__c';
    @api supportingFields;//='Resource_Engagement__c:Name,Project__c,Resource__c,Start_Date_of_Engagement__c,End_Date_of_Engagement__c,Team__c,Status__c,Hours_Engaged__c,Engaged_Days__c-';// first objectName:commaseparated supporting fields
    @api allocationId;
    @api currentObject;
    @api fieldToQueryString;
    @api readOnly=false;
    @api filterObjectsTitle='Select Entity';
    @api filterMainTitle='Select Filter Options';
    @api filterFieldTitle='Select Field';
    @api filterOperators;
    @api saveButtonLabel='Confirm';
    @api cancelButtonLabel='Close';
    @api key='fieldsComponent';


    @track objectsData;
    @track selectedObject;
    @track filterConditions=[];
    @track filterLogic='';
    @track selectedField;
    @track displayApply=false;
    @track picklistOptions=[];
    @track selectedFilterOperator;
    @track selectedFilterOperatorValue;
    @track conditionToEdit;
    @track displaySave=false;
    @track inited=false;
    
    get selectedObjectLabel(){
        return this.selectedObject ? this.selectedObject.label: null;
    }
    get filterOperatorOptions(){
        
        if(this.selectedField && this.selectedField?.api && this.filterOperators && this.filterOperators[this.selectedField?.type?.toLowerCase()]){
            let retVal= [];
            let obj1={};
            obj1.label='--SELECT--';
            obj1.value='';
            retVal.push(obj1);
            let arr=this.filterOperators[this.selectedField.type.toLowerCase()];
            if(arr){
                arr.forEach(element => {
                    let obj={};
                    obj.label=element.label;
                    obj.value=element.label;
                    retVal.push(obj);
                }); 
                
            }
            return retVal;    
        }
        return null;
    }
    get displayPills(){
        let retVal=false;
        if(this.objectsData){
            this.objectsData.forEach(element => {
                if((!retVal) && element.conditions && element.conditions?.length>0){
                    retVal=true;
                }
            }); 
        }
        return retVal;
    }
    get displayFilterLogic(){
        let count=0;
        if(this.objectsData){
            this.objectsData.forEach(element => {
                if(element.conditions && element.conditions?.length>0){
                    count= (count+1);
                }
            }); 
        }
        return (count>1) ? true:false;
    }
    get selectedFieldLabel(){
        return this.selectedField ? this.selectedField?.label: null;
    }
    get displayFilterOpertor(){
        return this.selectedField && this.selectedField?.label && this.filterOperators && this.filterOperators[this.selectedField?.type.toLowerCase()];
    }
    get isFieldTypeId(){
        return (this.selectedField && this.selectedField?.type.toLowerCase()=='id')? true: false;
    }
    get isFieldTypeReference(){
        return (this.selectedField && this.selectedField?.type.toLowerCase()=='reference')? true: false;
    }
    get isFieldTypeBoolean(){
        return (this.selectedField && this.selectedField?.type.toLowerCase()=='boolean')? true: false;
    }
    get isFieldTypeMultiPickList(){
        return (this.selectedField && this.selectedField?.type.toLowerCase()=='multipicklist')? true: false;
    }
    get isFieldTypePickList(){
        return (this.selectedField && this.selectedField?.type.toLowerCase()=='picklist')? true: false;
    }
    get isFieldTypeString(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='string') ? true : false;
    }
    get isFieldTypeNumber(){
        return (this.selectedObject && (this.selectedField?.type.toLowerCase()=='integer' || this.selectedField?.type.toLowerCase()=='double')) ? true : false;
    }
    get isFieldTypeDate(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='date' ) ? true : false;
    }
    get isFieldTypeDateTime(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='datetime') ? true : false;
    }
    get isFieldTypeTime(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='time') ? true : false;
    }
    get isFieldTypePercent(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='percent') ? true : false;
    }
    get isFieldTypeCurrency(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='currency') ? true : false;
    }
    get isFieldTypeEmail(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='email') ? true : false;
    }
    get isFieldTypeURL(){
        return (this.selectedObject && this.selectedField?.type.toLowerCase()=='url') ? true : false;
    }
    
    get objectOptions(){
        if(this.objectsData){
            let arr=[];
            let obj1={};
            obj1.label='--SELECT--';
            obj1.value='';
            arr.push(obj1);
            this.objectsData.forEach(element => {
                let obj={};
                obj.label=element.label;
                obj.value=element.label;
                arr.push(obj);
            }); 
            return arr;
        }else
            return null;
        
    }
    get fieldOptions(){
        if(this.selectedObject?.fields){
            let arr=[];
            let obj1={};
            obj1.label='--SELECT--';
            obj1.value='';
            arr.push(obj1);
            this.selectedObject.fields.forEach(element => {
                let obj={};
                obj.label=element.label;
                obj.value=element.label;
                arr.push(obj);
            }); 
            return arr;
        }else
            return null;
        
    }
    
    getFilterCondition(recName){
        let con= this.selectedField.api;
        let symbl= this.selectedFilterOperator.symbol=='%LIKE' ? 'LIKE': this.selectedFilterOperator.symbol;
        let val=recName? recName: this.selectedField.value;
        switch (this.selectedField?.type.toLowerCase()) {
            case "date":
                val = val;
                break;
            case "datetime":
                val = val;
                break;
            case "string":
                val = "\'"+val+"\'";
                break;
            case "double":
                val =val;
                break;
            case "picklist":
                val = "\'"+val+"\'";
                break;
            case "textarea":
                val = "\'"+val+"\'";
                break;
            case "percent":
                val = val;
                break;
            case "url":
                val = "\'"+val+"\'";
                break;
            case "integer":
                val =val;
                break;
            case "reference":
                val = "\'"+val+"\'";
                break;
            case "boolean":
                val = val;
                break;
            case "phone":
                val = "\'"+val+"\'";
                break;
            case "currency":
                val = val;
                break; 
            case "id":
                val = "\'"+val+"\'";
                break;    
            case "email":
                val = "\'"+val+"\'";
                break;  
            case "multipicklist":
                val.split(";").forEach(element => {
                    val=val? val+ "\'"+element+"\'"+",": "(\'"+element+"\'"+",";
                });
                val+=")";
                break;        
          }
        return "("+con+" "+symbl+" "+val+")";
    }
    handleObjectSelection(event){
        this.selectedObject=null;
        this.selectedFilterOperator= null;
        this.picklistOptions=[];
        this.objectsData.forEach(element => {
            if(element.label==event.target.value){
                this.selectedObject=  { ...element }; 
            }
        });
    }
    
    handleFilterSelection(event){
        this.selectedFilterOperatorValue=event.target.value;
        this.filterOperators[this.selectedField.type.toLowerCase()].forEach(element => {
            if(element.label==event.target.value){
                this.selectedFilterOperator=  { ...element }; 
            }
        });
    }
    handleFieldSelection(event){
        this.selectedField=null;
        this.selectedFilterOperator= null;
        this.picklistOptions=[];
        this.selectedObject.fields.forEach(element => {
            if(element.label==event.target.value){
                this.selectedField=  { ...element }; 
                /*if(this.selectedField.options){
                    this.selectedField.options.forEach(optn => {
                        let ob={};
                        ob.label=optn;
                        ob.value=optn;
                        this.picklistOptions.push(optn);
                    });
                }*/
            }
        });
    }
    handlefilerOperatorChange(event){

    }
    handleRecordSelect(event) {
        
        const returnObj = JSON.parse(JSON.stringify(event.detail));
        this.selectedField.value = returnObj.Name;
        this.selectedField.id = returnObj.Id;
    }
    
    handleRemoveRecord() {
        this.selectedField.id = null;
        this.selectedField.value = null;
    }
    handleValueChange(event){
        this.selectedField.value =this.selectedField.value=event.target.value.toString();
    }
   
    handleRemoveCondition(event){
        let flag=false;
        let idx;
        let objIdx;
        let objData= JSON.parse(JSON.stringify(this.objectsData));
        //this.objectsData=null;
        objData.forEach((element,i) => {
            if((!flag) && (element.conditions && (element.conditions?.length>0))){
                element.conditions.forEach((ele,indx) => {
                    if(!flag && (ele == event.target.name)){
                        flag=true;
                        idx=indx;
                        objIdx=i;
                    }
                }); 
            }
        });
        if(flag){
            objData[objIdx].conditions?.splice(idx,1);
            objData[objIdx].apiConditions?.splice(idx,1);
        }
        this.objectsData=JSON.parse(JSON.stringify(objData));
        if(this.selectedObject){
            flag=false;
            this.selectedObject.conditions.forEach((ele,indx) => {
                if(!flag && (ele == event.target.name)){
                    flag=true;
                    objIdx=indx;
                }
            });
            if(flag){
                this.selectedObject[objIdx].conditions?.splice(idx,1);
                this.selectedObject[objIdx].apiConditions?.splice(idx,1); 
            }
            
        }
        
    }
    handleEditCondition(event){
        //this.objectsData.fields.splice(parseInt(event.target.name),1);
        this.conditionToEdit=event.target.value;
    }
    handleSaveCondition(event){
        //let isValid = ((this.selectedField.type.toLowerCase()=='id' && this.selectedField.id ) || (this.selectedField.type.toLowerCase()!='id' && this.selectedField.value));
        let isValidLogic =this.validateFilterLogic() ;
        if(isValidLogic){
            //let con=this.selectedField.label +' '+this.selectedFilterOperator +' '+this.selectedField.label;
            /*if(this.conditionToEdit){
                this.objectsData.conditions.forEach((element,indx) => {
                    if(element == this.conditionToEdit){
                        this.objectsData.conditions[indx]=con;
                    }
                });
            }else{
                this.objectsData.conditions.push(con);
            }*/
            const evtToFire = new CustomEvent("prismfilterupdatesuccess", {
                detail: {objectData:this.objectsData}
            });
            this.dispatchEvent(evtToFire);
           // this.handleCancelCondition(event);
            //this.showNotification("Success", 'Filter is successfully applied', "success");
        }
        /*if(!isValid){
            this.showNotification("Error Field validation", 'Please provide field values to filter', "error");
        }else*/ if(!isValidLogic){
            this.showNotification("Error Field validation", 'Please provide valid filter logic', "error");
        }
        
    }
    applyFilter(event){
        event.preventDefault();
        this.selectedField.value= event.detail.fields[this.selectedField.api];
        if(this.selectedField.type.toLowerCase()=='id' || this.selectedField.type.toLowerCase()=='reference'){
            this.selectedField.id= event.detail.fields[this.selectedField.api];
            let query='select '+this.selectedField.api.replace('__c','__r')+'.Name' + ' from '+this.selectedObject.api+' where '+this.selectedField.api+'=\''+this.selectedField.value+'\' LIMIT 1';
            this.getQueryResult(event,query);
        }else{
            this.applyFilterHelper(event,null);
        }
    }
    applyFilterHelper(event,recName){
       
        let str = this.selectedField.label +' '+this.selectedFilterOperator.name+' '+ (recName? recName: this.selectedField.value);
        let con= this.getFilterCondition(recName);
        if(!this.selectedObject.conditions){
            this.selectedObject.conditions=[];
            this.selectedObject.apiConditions=[];
        }
        if(!this.selectedObject.conditions.includes(str)){
            this.selectedObject.conditions.push(str);
            this.selectedObject.apiConditions.push(con);
            
            let idx; 
            this.objectsData.forEach((element,indx) => {
                if(element.api == this.selectedObject.api){
                    element= { ...this.selectedObject};
                    idx=indx;
                }
            }); 
            this.objectsData[idx]=JSON.parse(JSON.stringify(this.selectedObject));
        }
           
        
        
        //this.selectedObject= null;
        this.selectedField= null;
        this.selectedFilterOperator= null;
        this.selectedFilterOperatorValue=null;
        this.picklistOptions=[]; 

    }
    getQueryResult(event,query){
        getRecordDtls({
            query : query
        })
        .then(resultRec => {
            if(resultRec){
                this.applyFilterHelper(event,(JSON.parse(resultRec))[0][this.selectedField.api.replace('__c','__r')].Name);
            }else{
                this.applyFilterHelper(event,null);
            }
        })
        .catch(error => {
            console.log(error.details.body.message);
        });
    }
    validateFilterLogic(){
        let count=0;
        if(this.objectsData){
            this.objectsData.forEach(element => {
                if(element.conditions && element.conditions?.length>1 && !element.filterLogic){
                    count+=1;
                }
            }); 
        }
        let isValidLogic = (count ==0); 
        if(isValidLogic){
            //check for logic pattern- Work pending??
        }
        return isValidLogic;
    }
    handleCancelCondition(event){
        this.selectedField= null;
        this.selectedFilterOperator= null;
        this.picklistOptions=[];
        this.selectedObject=null;
        this.displaySave= true;
    }
    handleClickCloseModal(event){
        this.objectsData.saveFieldsString();
        this.handleCancelCondition(event);
        this.fireCloseEvent();

    }
    
    
    connectedCallback(){
        let arr=[];
        if(this.supportingObjects && this.supportingObjects.split(",").length>0)
        {    this.supportingObjects.split(",").forEach(element => {
                arr.push(element.api);
            });
        }
        if(arr.length>0){
            if(this.allocationId && this.fieldToQueryString ){
                this.getFieldsString();
            }else{
                this.getFields();
            }
        }
    }

    getFieldsString(){
        getObjectFieldsString({
            currentObject : this.currentObject,
            fieldToQueryString: this.fieldToQueryString,
            recordId: this.allocationId
        })
        .then(resultRec => {
            if(resultRec){
                this.objectsData=JSON.parse(resultRec);
                this.inited=true;
            }else{
                this.getFields();
            }
        })
        .catch(error => {
            this.errorMessageNewRecord=error.details.body.message;
        });
    }
    
    getFields(){
        getObjectFields({
            objectTypes : this.supportingObjects.split(",")
        })
        .then(resultRec => {
            if(resultRec){
              let objList=JSON.parse(resultRec);
              let tempObj=[];
              if(this.supportingFields){
                    let objFldArr=this.supportingFields.split("-"); // we get a string with object api followed by ":" and commaseparated fields
                    objFldArr.forEach(objfld => {
                        let temp = objfld.split(":");
                        objList.forEach(objtemp =>{
                            if(objtemp.api==temp[0]){
                                let flds = temp[1].split(",");
                                let updatedFields=[];
                                objtemp.fields.forEach(field =>{
                                    if(flds.includes(field.api)){
                                        updatedFields.push(field);
                                    }
                                });
                                objtemp.fields=updatedFields;
                            }
                        });

                    });
                this.objectsData=objList;
              }
              this.objectsData=JSON.parse(resultRec);
              this.inited=true;
            }else{
              this.errorMessageNewRecord= 'Error getting filters data';
            }
        })
        .catch(error => {
            this.errorMessageNewRecord=error.details.body.message;
        });
    }
    saveFieldsString(){
        saveObjectFieldsString({
            currentObject : this.currentObject,
            fieldToQueryString: this.fieldToQueryString,
            recordId: this.allocationId,
            fieldString:JSON.stringify(this.objectsData)
        })
        .then(resultRec => {
            if(resultRec){
                this.objectsData=JSON.parse(resultRec);
            }else{
                this.getFields();
            }
        })
        .catch(error => {
            this.errorMessageNewRecord=error.details.body.message;
        });
    }
    
    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
    fireCloseEvent() {
        const evtToFire = new CustomEvent('prismfilterupdateclose', {
            detail: {}
        });
        this.dispatchEvent(evtToFire);
    }
    
}