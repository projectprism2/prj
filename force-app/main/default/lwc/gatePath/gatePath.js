import { LightningElement, wire,api, track } from 'lwc';
import getAssignedGatesByProject from '@salesforce/apex/GateAssignmentHandler.getAssignedGatesByProject';
import updateAssignedGatesByProject from '@salesforce/apex/GateAssignmentHandler.updateAssignedGatesByProject';

export default class GatePath extends LightningElement {
    gateIdToComplete;
    gateIndex;
    @track assignedGates=[];
    gateStatus='slds-path__item slds-is-incomplete'
    @api recordId;

    @wire(getAssignedGatesByProject,{projectId:'$recordId'}) 
    wiredAssignedGates({error,data}){
        if(data){
            console.log(data);
            this.assignedGates = data.map(gate =>{
                
                if(gate.Status__c == 'In Progress'){
                    this.gateIdToComplete = gate.Id;
                    this.gateIndex = gate.Gate__r.Sort_Order__c;
                    return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-active slds-is-current'};
                }
                else if(gate.Status__c == 'Completed'){
                    return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-complete'};
                }
                
                else {
                //(gate.Status__c == 'Open'){
                    return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-incomplete'};
                }
                // else throw new Error('Gate Status not assigned');
            });
        }
        if(error){
            console.log(error);
        }
    }

    refreshAssignedGates(){
        console.log('refreshAssignedGates called');
        getAssignedGatesByProject({projectId:this.recordId})
        .then(result => {
            
        })
        .catch(error =>{
            console.log(error);
        })
    }

    updateAssignedGatesByProject(){
        console.log(this.gateIdToComplete);
        updateAssignedGatesByProject({projectId:this.recordId,gateIdToComplete:this.gateIdToComplete})
        .then((result) =>{
            // getRecordNotifyChange([{recordId: this.recordId}]);
            console.log('succesfully updated path');
            console.log(result);
            // this.refreshAssignedGates();
            const data = result;
            // this.wiredAssignedGates({data:result.data,error:result.error});
            if(data){
                console.log(data);
                this.assignedGates = data.map(gate =>{
                    
                    if(gate.Status__c == 'In Progress'){
                        this.gateIdToComplete = gate.Id;
                        this.gateIndex = gate.Gate__r.Sort_Order__c;
                        return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-active slds-is-current'};
                    }
                    else if(gate.Status__c == 'Completed'){
                        return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-complete'};
                    }
                    
                    else {
                    //(gate.Status__c == 'Open'){
                        return {Id:gate.Id+'-'+gate.Gate__r.Sort_Order__c,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-incomplete'};
                    }
                    // else throw new Error('Gate Status not assigned');
                });
            }
            
        })
        .catch(error =>{
            console.log(error);
        })

        /*
        let breakLoop = false;
        console.log(this.gates);
        const fields = this.gates.map(gate =>{
            if(!breakLoop){
                if(gate.Id == assignedGateId){
                    breakLoop = true;
                    return {Id:gate.Id,Name:gate.Name,Status__c:'In Progress',Project__c:gate.Project__c};
                }
                return {Id:gate.Id,Name:gate.Name,Status__c:'Completed',Project__c:gate.Project__c};
            }
            return;
        });
        */
    }


    identifyGateId(event){
        console.log(event);
        console.log(event.currentTarget.id);
        let gateId = event.currentTarget.id;
        this.gateIdToComplete = gateId.split('-')[0];
        this.gateIndex = gateId.split('-')[1];
        console.log(this.gateIndex);
        console.log(this.gateIdToComplete);
        // the logic should chnage after markstatus button is clicked to IN proggress should be changed to Completed.
    }

    //This is copied from an article -- not in use
    pathHandler(event)
    {
        let targetId = event.currentTarget.id;
        let len = targetId.length;
        let mainTarId = targetId.charAt(4);
        let targatPrefix = targetId.substring(5, len);
        var selectedPath = this.template.querySelector("[id=" +targetId+ "]");
        if(selectedPath){
            this.template.querySelector("[id=" +targetId+ "]").className='slds-is-active slds-path__item';
        }
            for(let i = 0; i < mainTarId; i++){
                let selectedPath = this.template.querySelector("[id=pat-" +i+ targatPrefix+"]");
                if(selectedPath){
                    this.template.querySelector("[id=pat-" +i+ targatPrefix+"]").className='slds-is-complete slds-path__item';
                }
            }
            for(let i = mainTarId; i < 8; i++){
                if(i != mainTarId){
                    let selectedPath = this.template.querySelector("[id=pat-" +i+ targatPrefix+"]");
                    if(selectedPath){
                        this.template.querySelector("[id=pat-" +i+targatPrefix+ "]").className='slds-is-incomplete slds-path__item';
                    }
                }
            }
    }
}