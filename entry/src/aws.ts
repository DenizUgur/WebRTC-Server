import express from "express";
import { Router } from "express";
import AWS from "aws-sdk";

const router: Router = Router();
router.use(express.json());

// Set the AWS options
AWS.config.update({ region: "us-west-2" });
const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
const params = {
    DryRun: false,
    InstanceIds: [process.env.TARGET_INSTANCE],
};

router.get("/status", (req, res) => {
    ec2.describeInstances(params, (err, data) => {
        if (err) return res.status(500).send(err);

        const instance = data.Reservations[0].Instances[0];
        const status = instance.State.Name;

        return res.json({
            url: instance.PublicDnsName || false,
            status,
        });
    });
});

router.get("/start", (req, res) => {
    ec2.startInstances(params, (err) => {
        if (err) return res.status(500).send(err);

        return res.json({ status: "started" });
    });
});

router.get("/stop", (req, res) => {
    ec2.stopInstances(params, (err) => {
        if (err) return res.status(500).send(err);

        return res.json({ status: "stopped" });
    });
});

export default router;
