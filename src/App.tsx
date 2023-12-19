import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

import SearchPlants from './pages/searchPlants/SearchPlants';
import MyGarden from './pages/myGarden/MyGarden';
import IdentifyPlants from './pages/identifyPlants/IdentifyPlants';
import Header from './components/compounds/header/Header';


import UserAuthentication from './pages/userAuthentication/UserAuthentication';

import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { ProtectedRoute } from './ProtectedRoute.tsx';



const App: React.FC = () =>{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [user, setUser] = useState<User | null>(null);



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUser(user);
            return;
          } 
        setUser(null);

        });
        return () => {
          unsubscribe();
        };
      
    },[]);


    return (
        <>
        <BrowserRouter>
        <Header />
            <Routes>

                <Route path='/' element={
                <ProtectedRoute user={user}>
                    <SearchPlants />
                </ProtectedRoute> } />

            
            
            <Route path='/login' element={<UserAuthentication />} />
            
            
            

            <Route path='/my-garden' element={
                <ProtectedRoute user={user}>
                    <MyGarden />
                </ProtectedRoute> }  />

            <Route path='/identify-plants' element={
            <ProtectedRoute user={user}>
                <IdentifyPlants />
            </ProtectedRoute>}  />

            </Routes>
        </BrowserRouter>
        </>
    );
}

export default App;
