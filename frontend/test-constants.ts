import { REVERSE_GOAL_TARGET_MAP, GOAL_TARGET_MAP } from './src/config/constants';

console.log('GOAL_TARGET_MAP:', GOAL_TARGET_MAP);
console.log('REVERSE_GOAL_TARGET_MAP:', REVERSE_GOAL_TARGET_MAP);

const testZones = ['TL', 'TM', 'TR', 'ML', 'MM', 'MR', 'BL', 'BM', 'BR'];
testZones.forEach(zone => {
    console.log(`Zone ${zone} -> Target ${REVERSE_GOAL_TARGET_MAP[zone]}`);
});
