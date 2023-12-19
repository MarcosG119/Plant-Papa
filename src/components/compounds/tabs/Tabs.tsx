import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import './Tabs.css';
import { Link } from 'react-router-dom';




function samePageLinkNavigation(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

// interface LinkTabProps {
//   label?: string;
//   href?: string;
// }

// function LinkTab(props: LinkTabProps) {
//   return (
//     <Tab
//       component="a"
//       onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
//         // Routing libraries handle this, you can remove the onClick handle when using them.
//         if (samePageLinkNavigation(event)) {
//           event.preventDefault();
//         }
//       }}
//       {...props}
//     />
//   );
// }

export default function NavTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // event.type can be equal to focus with selectionFollowsFocus.
    if (
      event.type !== 'click' ||
      (event.type === 'click' &&
        samePageLinkNavigation(
          event as React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        ))
    ) {
      setValue(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={value} 
        onChange={handleChange} 
        variant="fullWidth" 
        aria-label="nav tabs example"
      >
        
        <Tab component={Link} label="Search" to="/" />
        <Tab component={Link} label="My Garden" to="/my-garden"/>
        <Tab component={Link} label="Identify Plants" to="/identify-plants"/>
      </Tabs>
    </Box>
  );
}