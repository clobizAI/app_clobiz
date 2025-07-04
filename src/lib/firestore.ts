import '@/lib/firebase-admin'; // Initialize Firebase Admin SDK first
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Contract, User } from '@/types';

export const db = getFirestore();
// 以降の関数はadmin SDK用に順次書き直す

// ユーザー操作
export const createUser = async (userId: string, userData: Omit<User, 'uid'>) => {
  try {
    await db.collection('users').doc(userId).set({
      ...userData,
      uid: userId,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const querySnapshot = await db.collection('users').where('email', '==', email).get();
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// 契約操作
export const createContract = async (contractData: Omit<Contract, 'id'>) => {
  try {
    const contractsRef = db.collection('contracts');
    const contractDoc = contractsRef.doc();
    await contractDoc.set({
      ...contractData,
      id: contractDoc.id,
    });
    return contractDoc.id;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
};

export const updateContract = async (contractId: string, updates: Partial<Contract>) => {
  try {
    await db.collection('contracts').doc(contractId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  try {
    await db.collection('users').doc(userId).update({
      ...updates,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getUserContracts = async (userId: string): Promise<Contract[]> => {
  try {
    const querySnapshot = await db.collection('contracts').where('userId', '==', userId).get();
    const contracts: Contract[] = [];
    querySnapshot.forEach((doc) => {
      contracts.push(doc.data() as Contract);
    });
    return contracts;
  } catch (error) {
    console.error('Error getting user contracts:', error);
    throw error;
  }
};

export const getUserContractsByEmail = async (email: string): Promise<Contract[]> => {
  try {
    const querySnapshot = await db.collection('contracts').where('customerEmail', '==', email).get();
    const contracts: Contract[] = [];
    querySnapshot.forEach((doc) => {
      contracts.push(doc.data() as Contract);
    });
    return contracts;
  } catch (error) {
    console.error('Error getting user contracts by email:', error);
    throw error;
  }
};

export const getContractById = async (contractId: string): Promise<Contract | null> => {
  try {
    const contractDoc = await db.collection('contracts').doc(contractId).get();
    if (contractDoc.exists) {
      return contractDoc.data() as Contract;
    }
    return null;
  } catch (error) {
    console.error('Error getting contract by ID:', error);
    throw error;
  }
};

// 容量プラン関連の操作
export const getContractsPendingStorageUpgrade = async (): Promise<Contract[]> => {
  try {
    const querySnapshot = await db.collection('contracts')
      .where('status', '==', 'active')
      .where('pendingStoragePlan', '!=', null)
      .get();
    const contracts: Contract[] = [];
    querySnapshot.forEach((doc) => {
      contracts.push(doc.data() as Contract);
    });
    return contracts;
  } catch (error) {
    console.error('Error getting contracts pending storage upgrade:', error);
    throw error;
  }
};

export const applyPendingStorageUpgrade = async (contractId: string): Promise<void> => {
  try {
    const contract = await getContractById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (!contract.pendingStoragePlan) {
      throw new Error('No pending storage plan found');
    }
    await updateContract(contractId, {
      currentStoragePlan: contract.pendingStoragePlan,
      pendingStoragePlan: undefined,
      storageUpgradeAppliedDate: new Date().toISOString(),
    });
    console.log('Storage upgrade applied successfully:', {
      contractId,
      newStoragePlan: contract.pendingStoragePlan
    });
  } catch (error) {
    console.error('Error applying pending storage upgrade:', error);
    throw error;
  }
};

export const applyAllPendingStorageUpgrades = async (): Promise<{ success: number; failed: number }> => {
  try {
    const pendingContracts = await getContractsPendingStorageUpgrade();
    let success = 0;
    let failed = 0;
    console.log(`Processing ${pendingContracts.length} pending storage upgrades...`);
    for (const contract of pendingContracts) {
      try {
        await applyPendingStorageUpgrade(contract.id);
        success++;
      } catch (error) {
        console.error(`Failed to apply storage upgrade for contract ${contract.id}:`, error);
        failed++;
      }
    }
    console.log(`Storage upgrade batch completed: ${success} success, ${failed} failed`);
    return { success, failed };
  } catch (error) {
    console.error('Error applying all pending storage upgrades:', error);
    throw error;
  }
};

export const cancelStorageUpgrade = async (contractId: string): Promise<void> => {
  try {
    const contract = await getContractById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (!contract.pendingStoragePlan) {
      throw new Error('No pending storage plan found');
    }
    await updateContract(contractId, {
      pendingStoragePlan: undefined,
    });
    console.log('Storage upgrade cancelled successfully:', { contractId });
  } catch (error) {
    console.error('Error cancelling storage upgrade:', error);
    throw error;
  }
}; 