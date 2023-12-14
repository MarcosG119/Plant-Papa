import React, { useState} from 'react';
import './UserAuthentication.css';
import logo from '../../images/plant_papa_logo.png';

import TextInput from '/Users/marcos/Hacker/Plant-Papa/Plant-Papa/src/components/elements/textInput/TextInput.tsx';
import Button from '../../components/elements/button/Button.tsx';

const UserAuthentication: React.FC = () => {

    const[email, setEmail] = useState<string>('');
    const[password, setPassword] = useState<string>('');

    

    return (
        <div>
            <img src={logo} alt="Plant Papa Logo" />
            <div className='user-authentication'>
                <h1>Sign In</h1>
                <form>
                    <TextInput type='email' value={email} onChange={(e: string) => setEmail(e)} placeholder='Email' />
                    <br />
                    <br />
                    <TextInput type='password' value={password} onChange={(e: string) => setPassword(e)} placeholder='Password' />
                    <br />
                    <br />
                    <div className="center-buttons">
                        <Button text='Sign In' onClick={() => {}} />
                        &emsp;&emsp;&emsp;
                        <Button text='Sign Up' onClick={() => {}} />
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserAuthentication;