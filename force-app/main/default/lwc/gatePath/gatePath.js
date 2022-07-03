import { LightningElement, wire,api } from 'lwc';
import getAssignedGatesByProject from '@salesforce/apex/gate.getAssignedGatesByProject';
import updateAssignedGatesByProject from '@salesforce/apex/gate.updateAssignedGatesByProject';

export default class GatePath extends LightningElement {
    gates;
    assignedGates=[];
    @api recordId;

    @wire(getAssignedGatesByProject,{projectId:'$recordId'}) 
    wiredAssignedGates({error,data}){
        if(data){
            this.gates = data;
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

    updateAssignedGatesByProject(){

        let gateId = 'a011y000003D3KCAA0';
        updateAssignedGatesByProject({projectId:this.recordId,assignedGateId:gateId})
        .then(result =>{
            getRecordNotifyChange([{recordId: this.recordId}]);
            console.log('succesfully updated path');
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
}