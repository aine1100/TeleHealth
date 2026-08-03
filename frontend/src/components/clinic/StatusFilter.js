import React from 'react';
import Dropdown from '../auth/Dropdown';

const StatusFilter = ({ value, onChange, options, label = 'Status' }) => {
  return (
    <div className="w-full sm:w-[200px]">
      <Dropdown
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Select status"
      />
    </div>
  );
};

export default StatusFilter;
