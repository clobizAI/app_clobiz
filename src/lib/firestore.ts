import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseDemo } from './firebase';
import { Contract, User } from '@/types';

// ユーザー操作
export const createUser = async (userId: string, userData: Omit<User, 'uid'>) => {
  if (isFirebaseDemo) {
    console.log('Demo mode: User creation skipped', { userId, userData });
    return;
  }
  
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
  if (isFirebaseDemo) {
    console.log('Demo mode: User retrieval skipped', { userId });
    return null;
  }
  
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

// 契約操作
export const createContract = async (contractData: Omit<Contract, 'id'>) => {
  if (isFirebaseDemo) {
    console.log('Demo mode: Contract creation skipped', { contractData });
    return 'demo-contract-id';
  }
  
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
  if (isFirebaseDemo) {
    console.log('Demo mode: Contract update skipped', { contractId, updates });
    return;
  }
  
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

export const getUserContracts = async (userId: string): Promise<Contract[]> => {
  if (isFirebaseDemo) {
    console.log('Demo mode: Contract retrieval skipped', { userId });
    return [];
  }
  
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