import {Request, Response} from 'express';
import { IDatabase } from './database';

import isValidDateParameter from './isValidDateParameter';
import isValidNonNegativeIntegerParameter from './isValidNonNegativeIntegerParameter';

export function handePercentilesRequest(database: IDatabase) {
  return async (req: Request, res: Response) => {
    const { to, from, page, userId } = req.query;

    if (!isValidDateParameter(from)) {
      res.status(400).send("Query parameter 'from' is required to be a valid date of the form 'yyyy-mm-dd'");
      return;
    }

    if (!isValidDateParameter(to)) {
      res.status(400).send("Query parameter 'to' is required to be a valid date of the form 'yyyy-mm-dd'");
      return;
    }

    if(new Date(to) < new Date(from)) {
      res.status(400).send("Query parameter 'to' must be on or after 'from'");
      return;
    }

    if(page !== undefined && !isValidNonNegativeIntegerParameter(page)) {
      res.status(400).send("Query parameter 'page' must be a valid nonnegative integer");
      return;
    }

    if(userId !== undefined && !isValidNonNegativeIntegerParameter(userId)) {
      res.status(400).send("Query parameter 'userId' must be a valid nonnegative integer");
      return;
    }

    const data = userId === undefined
      ? await database.getReportsForAllUsers(from, to, parseInt(page) || 0)
      : await database.getReportsForUser(userId, from, to, parseInt(page) || 0);

    res.json(data); 
  }
};