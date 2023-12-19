import React from 'react';
import Container from '../../elements/container/Container';
import './SearchContainer.css';
import Button from '../../elements/button/Button';

interface SearchContainerProps {
    name: string;
    scientificName: string;
    picture: string;
    description: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
    name,
    scientificName,
    picture,
    description,
}) => {




    return (

        


        <div className='searchContainer'>
        <Container borderRadius='30px'>
            <h2>{name}</h2>
            <p>Scientific Name: {scientificName}</p>
            
            
            <div className='row'>
            
            
            
            <div className='imgCol'>
            <img className="img" src={picture} alt="Picture of plant" />
            </div>



            <div className='pCol'>
            <p>{description}</p>
            </div>




            
            </div>
            
            <div className='addButton'>
            <Button text="Add to Garden" onClick={() => {}} />
            </div>
            
        </Container>
        </div>
    );
};

export default SearchContainer;
