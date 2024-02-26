import React from 'react';

import Tabs from '../tabs/Tabs';
import Button from '../../elements/button/Button';

import { signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';

import './Header.css';

const Header: React.FC = () => {
    const [userError, setUserError] = React.useState<string>('');
    
    const user = auth?.currentUser?.email;


    const logout = async () => {
        try{
            await signOut(auth);
        }catch(error){
            console.log(error);
            const errorMessage = error as string;
            setUserError(errorMessage);
            alert(userError);
        }
    };



    return (
        <header>
            <div className="row">
                <div className="col1">
                    <h1 className='h1'>Plant Papa</h1>
                </div>
                <div className="col2">{ user ?
                    <Button text="Logout" onClick={logout} /> : <></>
                    }
                </div>
            </div>

            {
                auth.currentUser?.uid && <Tabs />
            }
        </header>
    );
};

export default Header;
