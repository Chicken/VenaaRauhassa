import React, { type SetStateAction } from "react";
import { Modal, Form, Input, Button, message } from "antd";

type FeedbackModalProps = {
  isFbModalOpen: boolean;
  setIsFbModalOpen: (value: SetStateAction<boolean>) => void;
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isFbModalOpen,
  setIsFbModalOpen,
}) => {
  const [messageApi, messageContextHolder] = message.useMessage();

  const [fbForm] = Form.useForm();

  return (
    <>
      {messageContextHolder}
      <Modal
        title="Palautelaatikko"
        open={isFbModalOpen}
        onOk={() => {
          setIsFbModalOpen(false);
          fbForm.resetFields();
        }}
        onCancel={() => {
          setIsFbModalOpen(false);
          fbForm.resetFields();
        }}
        centered={true}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setIsFbModalOpen(false);
              fbForm.resetFields();
            }}
          >
            Peruuta
          </Button>,
          <Button
            form="myForm"
            key="submit"
            htmlType="submit"
            onClick={() => {
              fbForm.submit();
            }}
            type="primary"
          >
            Lähetä
          </Button>,
        ]}
      >
        <Form
          form={fbForm}
          layout="vertical"
          style={{ marginTop: "2em" }}
          onFinish={(values) => {
            void (async () => {
              setIsFbModalOpen(false);
              fbForm.resetFields();
              messageApi
                .open({
                  type: "success",
                  content: "Kiitos palautteesta!",
                })
                .then(
                  () => null,
                  () => null
                );

              await fetch("/api/sendFeedback", {
                method: "POST",
                body: JSON.stringify(values),
              });
            })();
          }}
        >
          <Form.Item
            name="email"
            label="Sähköposti (Vapaaehtoinen)"
            rules={[
              {
                type: "email",
                message: "Syötä kelvollinen sähköpostiosoite!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Palaute"
            name="feedback"
            rules={[
              { required: true, message: "Tyhjää palautetta ei voi lähettää!" },
              { max: 1500, message: "Maksimipituus on 1500 merkkiä!" },
            ]}
          >
            <Input.TextArea
              placeholder="Anna palautetta tai kehitysideoita..."
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
