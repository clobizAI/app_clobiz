import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Contract, User } from '@/types';

// ユーザー操作
export const createUser = async (userId: string, userData: Omit<User, 'uid'>) => {
  try {
    await setDoc(doc(db, 'users', userId), {
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
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
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
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
    const contractsRef = collection(db, 'contracts');
    const contractDoc = doc(contractsRef);
    
    await setDoc(contractDoc, {
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
    await updateDoc(doc(db, 'contracts', contractId), {
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
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getUserContracts = async (userId: string): Promise<Contract[]> => {
  try {
    const q = query(
      collection(db, 'contracts'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
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
    const q = query(
      collection(db, 'contracts'),
      where('customerEmail', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
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
    const contractDoc = await getDoc(doc(db, 'contracts', contractId));
    if (contractDoc.exists()) {
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
    const q = query(
      collection(db, 'contracts'),
      where('status', '==', 'active'),
      where('pendingStoragePlan', '!=', null)
    );
    
    const querySnapshot = await getDocs(q);
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
    
    // pendingStoragePlanをcurrentStoragePlanに適用
    await updateContract(contractId, {
      currentStoragePlan: contract.pendingStoragePlan,
      pendingStoragePlan: undefined, // 申請中フラグをクリア
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
    
    // pendingStoragePlanをクリア
    await updateContract(contractId, {
      pendingStoragePlan: undefined,
    });
    
    console.log('Storage upgrade cancelled successfully:', { contractId });
  } catch (error) {
    console.error('Error cancelling storage upgrade:', error);
    throw error;
  }
}; 