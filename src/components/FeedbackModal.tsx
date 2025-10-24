import { Button, Form, Input, message, Modal } from "antd";
import React, { type SetStateAction } from "react";

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

              void messageApi.open({
                key: "feedback-loading",
                type: "loading",
                content: "Lähetetään palautetta...",
              });

              await fetch("/api/feedback", {
                method: "POST",
                body: JSON.stringify(values),
              })
                .then((res) => {
                  if (!res.ok) throw new Error("Not ok");
                  messageApi.destroy("feedback-loading");
                  void messageApi.open({
                    type: "success",
                    content: "Kiitos palautteesta!",
                  });
                })
                .catch(() => {
                  messageApi.destroy("feedback-loading");
                  void messageApi.open({
                    type: "error",
                    content: "Palautteen lähettäminen epäonnistui.",
                  });
                });
            })();
          }}
        >
          <p>
            Jos ilmoitat virheestä tai ongelmasta niin jätäthän sähköpostisi, jotta voimme
            tarvittaessa kysyä lisätietoja. Ongelmia ja ominaisuuspyyntöjä voi myös luoda
            Venaarauhassa projektin{" "}
            <a
              style={{
                color: "rgba(0,0,0,0.7)",
                textDecoration: "underline",
              }}
              href="https://github.com/Chicken/VenaaRauhassa/issues"
            >
              GitHub-repositorioon
            </a>
            .
          </p>
          <Form.Item
            name="email"
            label="Sähköposti (Vapaaehtoinen)"
            style={{ fontWeight: 500 }}
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
            style={{ fontWeight: 500 }}
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
