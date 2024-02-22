import React, {useState} from 'react';
import TextInput from '../../components/elements/textInput/TextInput.tsx';
import axios from 'axios';
import './SearchPlants.css';
import SearchContainer from '../../components/compounds/searchContainer/SearchContainer.tsx';



interface apiPlantProps{
    id: number;
    common_name: string;
    scientific_name: string;
    image_url: string;
    family_common_name: string;
    year: number;
}





const SearchPlants: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<apiPlantProps[]>();

    React.useEffect(() => {
        getSearchedPlants();
    },[]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            console.log('enter pressed');
            getSearchedPlants();
        }
    }



    

    const getSearchedPlants = async () => {
        try{

            const response = await axios.get(`https://plant-papa-api.onrender.com/api/plants/search?q=${searchQuery}`);
            const data = await response.data;
            setSearchResults(data.data);
        }catch(error){
            console.log(error);
        }finally{
            console.log(searchResults);
        }
    }





    return (
        <>



            <div className='searchBar'>
                <TextInput placeholder='Search for plants...' value={searchQuery} onChange={(e:string) => setSearchQuery(e)} onKeyDown={handleKeyDown}/>
            </div>
            



                {searchResults && searchResults.length > 0 && searchResults.map((data, index) => {
                return(    
                <div key={index} className="searchResults">
                
                    <div className="searchResult">
                        <SearchContainer id={data.id} name={data.common_name} scientificName={data.scientific_name} picture={data.image_url} description={"This " + data.common_name + " belongs to the " + data.family_common_name + ". It was first discovered in " + data.year +"."} />

                    </div>
                </div>
                )
            })}

            
    
        </>
        );
};

export default SearchPlants;
