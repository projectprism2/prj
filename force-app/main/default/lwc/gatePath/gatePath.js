import { LightningElement, wire,api,track } from 'lwc';
import getAssignedGatesByProject from '@salesforce/apex/gate.getAssignedGatesByProject';

export default class GatePath extends LightningElement {
    @track assignedGates=[];
    @api recordId;

    @wire(getAssignedGatesByProject,{projectId:'$recordId'}) 
    wiredAssignedGates({error,data}){
        if(data){
            console.log(data);
            console.log('assignedGates');
            this.assignedGates = data.map(gate =>{
                if(gate.Status__c == 'Open'){
                    return {Id:gate.Id,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-incomplete'};
                }
                else if(gate.Status__c == 'In Progress'){
                    return {Id:gate.Id,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-active slds-is-current'};
                }
                else if(gate.Status__c == 'Completed'){
                    return {Id:gate.Id,Name:gate.Name,Status:gate.Status__c,gateStatus:'slds-path__item slds-is-complete'};
                }
                else throw new Error('Gate Status not assigned');
            })
            console.log(this.assignedGates);
        }
        if(error){
            console.log(error);
        }
    }
}